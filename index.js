const xlsxFile = require('read-excel-file/node');
const fetch = require('node-fetch');
const L0TagsUrl = 'https://test-bff.airmeet.com/api/v1/tag/?tagType=LEVEL0';
const postL1TagsUrl = 'https://test-bff.airmeet.com/api/v1/tag';

// the logic for reading Excel sheet
let newL2Tags = xlsxFile('../newtags.xlsx', { sheet: 'Level2' }).then((rows) => rows);
let newL1Tags = xlsxFile('../newtags.xlsx', { sheet: 'Sheet5' }).then(
  (rows) => rows,
  (err) => console.warn(err)
);

const getL0Tags = async (url) => {
  console.log('first ... wait ... fetching Level-0 tags first...');
  try {
    const response = await fetch(url);
    const json = await response.json();
    // console.log(json);
    return json;
  } catch (error) {
    console.log('error in code for getL0Tags', error);
  }
};

const postL1Tags = async (url, dataToSend = []) => {
  console.log('third ... wait ... posting the Level-1 tags ... ');

  try {
    const response = await fetch(url, { method: 'POST', body: dataToSend });
    if (response.status === 200) {
      // response.headers.forEach((header) => console.log('hit the bff api', header));
      console.log('response is ', response);
      return { totalL1Tags: dataToSend.length, success: true, errorMessage: undefined };
    } else {
      return { totalL1Tags: dataToSend.length, success: false, errorMessage: response.statusText };
    }
  } catch (err) {
    console.warn('error in code for postL1Tags', err);
  }
};

const attachNewL1TagsWithL0Tags = async (currentlyFetchedL0Tags = []) => {
  console.log('second .... wait... attaching the Level tags with their parent IDs....');
  const resolveNewL1Tags = await newL1Tags;
  const l1TagsWithParentId = [];
  resolveNewL1Tags &&
    resolveNewL1Tags.forEach((x, idx) => {
      currentlyFetchedL0Tags.forEach((y, yidx) => {
        x[1].trim().toLowerCase() === y.name.trim().toLowerCase() &&
          l1TagsWithParentId.push({ type: x[0], name: x[2], parentId: y.id });
      });
    });
  console.table(l1TagsWithParentId);
  console.log(
    'Total of ',
    l1TagsWithParentId.length,
    "Level-1 tags have been attached with it's parent-id"
  );
  return l1TagsWithParentId;
};

const work = async () => {
  console.log('.... program starts ....');
  try {
    const { code, status, error, data } = await getL0Tags(L0TagsUrl);
    if (!error) {
      const l1TagsReadyToSend = await attachNewL1TagsWithL0Tags(data.LEVEL0);
      const { totalL1Tags, success, errorMessage } = await postL1Tags(
        postL1TagsUrl,
        l1TagsReadyToSend
      );
      if (!success) {
        console.log('there is some error while posting level-1 tags', errorMessage);
      } else {
        console.log('you successfully posted ', totalL1Tags, ' Level-1 tags');
      }
    }
    console.log('.... program ends ....');
  } catch (err) {
    console.log(err);
  }
};

work();
