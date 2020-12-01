const xlsxFile = require('read-excel-file/node');
const fetch = require('node-fetch');
const colors = require('colors');
const L1TagsUrl = 'https://test-bff.airmeet.com/api/v1/tag/?tagType=LEVEL1';
const postL2TagsUrl = 'https://test-bff.airmeet.com/api/v1/tag';

// the logic for reading Excel sheet
let newL2Tags = xlsxFile('../newtags.xlsx', { sheet: 'Level2' }).then((rows) => rows);
// let newL1Tags = xlsxFile('../newtags.xlsx', { sheet: 'Sheet5' }).then(
//   (rows) => rows,
//   (err) => console.warn(err)
// );

const getL1Tags = async (url) => {
  console.log(colors.bold.bgRed.yellow('first ... wait ... fetching Level-1 tags first...'));
  try {
    const response = await fetch(url);
    const json = await response.json();
    // console.log(json);
    return json;
  } catch (error) {
    console.log('error in code for getL1Tags', error);
  }
};

const postL2Tags = async (url, dataToSend = []) => {
  console.log(colors.bold.bgRed.yellow('third ... wait ... posting the Level-2 tags ... '));

  try {
    const response = await fetch(url, { method: 'POST', body: dataToSend });
    if (response.status === 200) {
      // response.headers.forEach((header) => console.log('hit the bff api', header));
      console.log('response is ', response);
      return { totalL2Tags: dataToSend.length, success: true, errorMessage: undefined };
    } else {
      return { totalL2Tags: dataToSend.length, success: false, errorMessage: response.statusText };
    }
  } catch (err) {
    console.warn('error in code for postL2Tags', err);
  }
};

const attachNewL2TagsWithL1Tags = async (currentlyFetchedL1Tags = []) => {
  console.log(
    colors.bold.bgRed.yellow(
      'second .... wait... attaching the Level tags with their parent IDs....'
    )
  );
  const resolveNewL2Tags = await newL2Tags;
  const l2TagsWithParentId = [];
  currentlyFetchedL1Tags.forEach((y, idx) =>
    console.log(colors.bgCyan.black('from fetched l1 tags', y.id, y.name, idx, y.parentId))
  );
  resolveNewL2Tags &&
    resolveNewL2Tags.forEach((x, idx) => {
      currentlyFetchedL1Tags.forEach((y, yidx) => {
        x[1].trim().toLowerCase() === y.name.trim().toLowerCase() &&
          l2TagsWithParentId.push({ type: x[0], name: x[2], parentId: y.id });
      });
    });
  console.table(colors.bold.bgRed.yellow(l2TagsWithParentId));
  console.log(
    colors.bold.bgBlue.white(
      'Total of ',
      l2TagsWithParentId.length,
      "Level-2 tags have been attached with it's parent-id"
    )
  );
  return l2TagsWithParentId;
};

const work = async () => {
  console.log(colors.bgBlue.yellow('.... program starts ....'));
  try {
    const { code, status, error, data } = await getL1Tags(L1TagsUrl);
    if (!error) {
      console.log(colors.bold.bgCyan.red('fetched l1 tags', data.LEVEL1.length));
      const l2TagsReadyToSend = await attachNewL2TagsWithL1Tags(data.LEVEL1);
      const { totalL2Tags, success, errorMessage } = await postL2Tags(
        postL2TagsUrl,
        l2TagsReadyToSend
      );
      if (!success) {
        console.log('there is some error while posting level-2 tags', errorMessage);
      } else {
        console.log('you successfully posted ', totalL2Tags, ' Level-2 tags');
      }
    }
    console.log(colors.bgBlue.yellow('.... program ends ....'));
  } catch (err) {
    console.log(err);
  }
};

work();
