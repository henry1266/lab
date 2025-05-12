const chokidar = require('chokidar');
const fs = require('fs-extra');
const xml2js = require('xml2js');
const iconv = require('iconv-lite');
const mongoose = require('mongoose');
const path = require('path');

const Patient = require('./models/Patient');

mongoose.connect('mongodb+srv://zhuwen:Henry22133@cluster0.mjorotn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  dbName: 'zhuwen',
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const watchDir = './xml_inbox';

const extractText = (node) => {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'object') return node._ || '';
  return '';
};

const parseXmlToPatientData = async (filePath) => {
  const buffer = await fs.readFile(filePath);
  const content = iconv.decode(buffer, 'big5');

  const parser = new xml2js.Parser({ explicitArray: false });
  const result = await parser.parseStringPromise(content);
  const pat = result.patient;
  const items = Array.isArray(pat.item) ? pat.item : [pat.item];

  const parsedItems = items.map(item => ({
    itmid: item.$?.itmid || '',
    nhiid: item.$?.nhiid || '',
    itmnm: extractText(item.itmnm),
    result: extractText(item.result),
    rstunit: extractText(item.rstunit),
    nlow: extractText(item.nlow),
    nhigh: extractText(item.nhigh)
  }));

  return {
    idno: pat.$.idno,
	patnm: pat.$.patnm,
    birdt: pat.$.birdt,
	regno: pat.$.regno,
    labid: pat.$.labid,
    labnm: pat.$.labnm,
    regdt: pat.$.regdt,
    rptdt: pat.$.rptdt,
    rpttm: pat.$.rpttm,
    items: parsedItems
  };
};

const processFile = async (filePath) => {
  const filename = path.basename(filePath);
  const errorDir = path.join('./error_xml');
  await fs.ensureDir(errorDir);

  try {
    await new Promise(resolve => setTimeout(resolve, 500)); // 👈 延遲 500ms 再開始處理
    const data = await parseXmlToPatientData(filePath);

    await Patient.updateOne(
      { birdt: data.birdt, regno: data.regno },
      { $set: data },
      { upsert: true }
    );

    await fs.remove(filePath);
    console.log(`[OK] 已更新/新增並刪除: ${filename}`);
  } catch (err) {
    console.error(`[ERROR] ${filename} 錯誤:`, err.message);

    const destPath = path.join(errorDir, filename);
    try {
      await fs.move(filePath, destPath, { overwrite: true });
      console.warn(`[MOVED] 錯誤檔案已移至: ${destPath}`);
    } catch (moveErr) {
      console.error(`[FAIL] 無法搬移錯誤檔案: ${moveErr.message}`);
    }
  }
};


chokidar.watch(watchDir, { ignoreInitial: false })
  .on('add', processFile)
  .on('error', err => console.error('監控失敗:', err));
