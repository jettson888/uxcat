const fs = require('fs-extra')
const cheerio = require('cheerio');
const { parseVueSFC, updateContentWithStyles } = require('../utils/parse-sfc.js');
const path = require('path');

async function run() {
  const filePath = path.join(__dirname, 'visitRegistration.vue');
  const spa = fs.readFileSync(filePath, {
    encoding: 'utf-8'
  })
  const { template } = parseVueSFC(spa)

  const content1 = getSegment(template, 3, 5, 'div')
  /**
*expect: 
 lineStart:3
 lineEnd:6
 segment:
  <div class="header">
    <h2>到访登记</h2>
    <p>请填写以下信息完成到访登记</p>
  </div>
*/
  console.log(content1)

  console.log('\n' + '='.repeat(50) + '\n');


  const content2 = getSegment(template, 4, 7, 'h2')
  /**
 *expect: 
  lineStart:4 
  lineEnd:4
  segment:
        <h2>到访登记</h2>
 */
  console.log(content2)

  console.log('\n' + '='.repeat(50) + '\n');

  const content3 = getSegment(template, 7, 5, 'form')
  /**
  *expect: 
   lineStart:7 
   lineEnd:42
   segment:
   <el-form :model="form" label-width="120px" class="registration-form">
    <el-form-item label="访客姓名">
      <el-input v-model="form.visitorName" placeholder="请输入访客姓名"/>
    </el-form-item>
    <el-form-item label="联系方式">
      <el-input v-model="form.contact" placeholder="请输入联系方式"/>
    </el-form-item>
    <el-form-item label="到访时间">
      <el-date-picker
        v-model="form.visitTime"
        type="datetime"
        placeholder="选择到访时间"
        format="yyyy-MM-dd HH:mm:ss"
        value-format="yyyy-MM-dd HH:mm:ss"/>
    </el-form-item>
    <el-form-item label="接待人员">
      <el-select v-model="form.receptionist" placeholder="请选择接待人员">
        <el-option
          v-for="receptionist in receptionists"
          :key="receptionist.id"
          :label="receptionist.name"
          :value="receptionist.id"/>
      </el-select>
    </el-form-item>
    <el-form-item label="访问事由">
      <el-input
        type="textarea"
        v-model="form.reason"
        placeholder="请输入访问事由"
        :rows="4"/>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submitForm">提交</el-button>
      <el-button @click="resetForm">取消</el-button>
    </el-form-item>
  </el-form>
  */
  console.log(content3)



  console.log('\n' + '='.repeat(50) + '\n');

  const content4 = getSegment(template, 25, 7, 'el-form-item')
  /**
   *expect: 
    lineStart:38 
    lineEnd:41
    segment:
     <el-form-item>
      <el-button type="primary" @click="submitForm">提交</el-button>
      <el-button @click="resetForm">取消</el-button>
    </el-form-item>
   */
  console.log(content4)

  console.log('\n' + '='.repeat(50) + '\n');


  const updatedTemp = await updateContentWithStyles(template, {
    'xxxx1': [
      {
        row: 4, col: 7, element: 'h2', styles: [{ prop: 'color', value: '#fff' }, { prop: 'font-weight', value: 'bold' }]
      }
    ],
    // 'xxxx2': [
    //   {
    //     row: 7, col: 5, element: 'el-form', styles: [{ prop: 'color', value: '#fff' }, { prop: 'font-weight', value: 'bold' }]
    //   }
    // ],
  })

  console.log(updatedTemp)

}

function getSegment(content, row, col, element, strict = false) {
  // Try without xmlMode to see if location info appears
  const $ = cheerio.load(content, {
    sourceCodeLocationInfo: true
  });

  let result = null;

  $('*').each((i, el) => {
    if (result) return false;

    if (el.type === 'tag') {
      const location = el.sourceCodeLocation;
      // console.log(`[DEBUG] Found <${el.name}> at ${location?.startLine}:${location?.startCol} (Expected ${element} at ${row}:${col})`);
      let tagNameValid = !strict ? el.name : el.name === element
      if (tagNameValid && location) {
        // Cheerio might be strict about exact startCol
        // We'll check if it matches row and col
        if (location.startLine === row && location.startCol === col) {
          result = {
            lineStart: location.startLine,
            lineEnd: location.endLine,
            segment: $.html(el)
          };
        }
      }
    }
  });

  return result;
}

run();