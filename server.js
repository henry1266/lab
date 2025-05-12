const express = require('express');
const mongoose = require('mongoose');
const Patient = require('./models/Patient');

const app = express();
const PORT = 3000;

mongoose.connect('mongodb+srv://zhuwen:Henry22133@cluster0.mjorotn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  dbName: 'zhuwen',
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(express.urlencoded({ extended: true }));

// 首頁顯示所有病患（以 idno 分組）
app.get('/', async (req, res) => {
  const patients = await Patient.aggregate([
    { $sort: { rptdt: -1 } },
    {
      $group: {
        _id: '$idno',
        patnm: { $first: '$patnm' },
        birdt: { $first: '$birdt' },
        rptdt: { $first: '$rptdt' }
      }
    }
  ]);

  res.send(`
    <h1>病患報告總覽</h1>
    <form action="/search" method="GET">
      <input type="text" name="q" placeholder="輸入姓名或身分證字號">
      <button type="submit">搜尋</button>
    </form>
    <ul>
      ${patients.map(p => `
        <li><a href="/person/${p._id}">${p.patnm || '(無名)'} - ${p._id} (${p.birdt})</a></li>
      `).join('')}
    </ul>
  `);
});

// 搜尋病患（idno 或 patnm）
app.get('/search', async (req, res) => {
  const keyword = req.query.q || '';
  if (!keyword) return res.redirect('/');

  const regex = new RegExp(keyword, 'i');
  const patients = await Patient.find({
    $or: [{ idno: regex }, { patnm: regex }]
  }).sort({ rptdt: -1 });

  const grouped = {};
  for (const p of patients) {
    if (!grouped[p.idno]) grouped[p.idno] = p;
  }

  res.send(`
    <h1>搜尋結果 for "${keyword}"</h1>
    <a href="/">← 回首頁</a>
    <ul>
      ${Object.values(grouped).map(p => `
        <li><a href="/person/${p.idno}">${p.patnm || '(無名)'} - ${p.idno} (${p.birdt})</a></li>
      `).join('')}
    </ul>
  `);
});

// 病患詳細頁（整合所有報告）
app.get('/person/:idno', async (req, res) => {
  const idno = req.params.idno;
  const records = await Patient.find({ idno }).sort({ rptdt: -1 });

  if (!records.length) return res.status(404).send('找不到病患資料');

  const { patnm, birdt } = records[0];

  res.send(`
    <h2>${patnm || '(無名)'} (${idno})</h2>
    <p>生日：${birdt}</p>
    <h3>共 ${records.length} 筆報告</h3>
    ${records.map(r => `
      <hr>
      <h4>報告日期：${r.rptdt}（掛號號碼：${r.regno}）</h4>
      <ul>
        ${r.items
          .filter(i => i.itmid !== 'J126')
          .map(i => `
            <li>${i.itmnm || '(無項目)'}：${i.result || '—'} ${i.rstunit || ''} 
            <small>[正常範圍: ${i.nlow || '-'} ~ ${i.nhigh || '-'}]</small></li>
          `).join('')}
      </ul>
    `).join('')}
    <a href="/">← 回首頁</a>
  `);
});

app.listen(PORT, () => {
  console.log(`🚀 Express 瀏覽介面啟動：http://localhost:${PORT}`);
});
