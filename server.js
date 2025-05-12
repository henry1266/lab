const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const Patient = require("./models/Patient");
const { groupItemsByReport } = require("./utils/categorizeItems");

const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

mongoose.connect("mongodb+srv://zhuwen:Henry22133@cluster0.mjorotn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
  dbName: "zhuwen",
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Function to escape special characters for RegExp
function escapeRegExp(string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

app.get("/", async (req, res) => {
  try {
    const patients = await Patient.aggregate([
      { $sort: { rptdt: -1 } },
      {
        $group: {
          _id: "$idno",
          patnm: { $first: "$patnm" },
          birdt: { $first: "$birdt" },
          rptdt: { $first: "$rptdt" }
        }
      },
      { $sort: { patnm: 1, _id: 1 } }
    ]);
    res.render("index", { patients });
  } catch (error) {
    console.error("Error fetching patients for homepage:", error);
    res.status(500).render("error", { message: "無法載入病患總覽", title: "錯誤" });
  }
});

app.get("/search", async (req, res) => {
  const keyword = req.query.q || "";
  if (!keyword) return res.redirect("/");

  try {
    const escapedKeyword = escapeRegExp(keyword); // Escape the keyword
    const regex = new RegExp(escapedKeyword, "i");
    const patientsRaw = await Patient.find({
      $or: [{ idno: regex }, { patnm: regex }]
    }).sort({ rptdt: -1 });

    const groupedPatients = {};
    for (const p of patientsRaw) {
      if (!groupedPatients[p.idno]) {
        groupedPatients[p.idno] = p;
      }
    }
    const patients = Object.values(groupedPatients).sort((a,b) => (a.patnm || "").localeCompare(b.patnm || "") || a.idno.localeCompare(b.idno) );

    res.render("search", { patients, keyword });
  } catch (error) {
    console.error("Error searching patients:", error);
    res.status(500).render("error", { message: "搜尋時發生錯誤", title: "錯誤" });
  }
});

app.get("/person/:idno", async (req, res) => {
  const idno = req.params.idno;
  try {
    const rawRecords = await Patient.find({ idno }).sort({ rptdt: -1 });

    if (!rawRecords.length) {
      return res.status(404).render("error", { message: "找不到病患資料", title: "錯誤" });
    }

    const records = groupItemsByReport(rawRecords);
    const { itemCategories, defaultCategory } = require("./utils/categorizeItems");
    const allCategories = Object.keys(itemCategories).concat(defaultCategory);

    res.render("person", { 
        records, 
        patient: records[0],
        allCategories
    }); 
  } catch (error) {
    console.error(`Error fetching patient details for ${idno}:`, error);
    res.status(500).render("error", { message: "載入病患詳細資料時發生錯誤", title: "錯誤" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Express 瀏覽介面啟動：http://localhost:${PORT}`);
});

