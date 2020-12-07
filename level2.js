const xlsxFile = require("read-excel-file/node");
const fetch = require("node-fetch");
const colors = require("colors");
const L1TagsUrl = "https://bff.airmeet.com/api/v1/tag/?tagType=LEVEL1";
const L2TagsUrl = "https://bff.airmeet.com/api/v1/tag/?tagType=LEVEL2";
const postL2TagsUrl = "https://bff.airmeet.com/api/v1/tag";

// the logic for reading Excel sheet
let newL2Tags = xlsxFile("./newtags.xlsx", { sheet: "Sheet6" }).then(
  (rows) => rows
);
// let newL1Tags = xlsxFile('./newtags.xlsx', { sheet: 'Sheet5' }).then(
//   (rows) => rows,
//   (err) => console.warn(err)
// );

const getL1Tags = async (url) => {
  // console.log(
  //   colors.bold.bgRed.yellow(
  //     "first ... wait ... fetching Level-1 tags first..."
  //   )
  // );
  try {
    const response = await fetch(url);
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("error in code for getL1Tags", error);
  }
};

const getL2Tags = async (url) => {
  // console.log(
  //   colors.bold.bgRed.yellow(
  //     "first ... wait ... fetching Level-1 tags first..."
  //   )
  // );
  try {
    const response = await fetch(url);
    const json = await response.json();
    return json;
  } catch (error) {
    console.log("error in code for getL2Tags", error);
  }
};

const verifyL2Tags = async (existingL2Tags) => {
  let pureNewL2Tags = await newL2Tags;
  pureNewL2Tags = pureNewL2Tags.filter((it) => it[1] !== null);
  existingL2Tags.forEach((e) => {
    pureNewL2Tags = pureNewL2Tags.filter(
      (it) => it[1].toLowerCase().trim() !== e.name.toLowerCase().trim()
    );
  });
  return pureNewL2Tags;
};

const postL2Tags = async (url, dataToSend = []) => {
  // console.log(
  //   colors.bold.bgRed.yellow("third ... wait ... posting the Level-2 tags ... ")
  // );
  console.log(dataToSend.length);
  try {
      const response = await fetch(url, { method: 'POST',
        body: JSON.stringify(dataToSend),
        headers:{
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-accesstoken': 'veldanda'
       }
    });
    console.log("response is ", response);
    if (response.status === 200) {
      // response.headers.forEach((header) => console.log('hit the bff api', header));
      return {
        totalL2Tags: dataToSend.length,
        success: true,
        errorMessage: undefined,
      };
    } else {
      return {
        totalL2Tags: dataToSend.length,
        success: false,
        errorMessage: response.statusText,
      };
    }
  } catch (err) {
    console.warn("error in code for postL2Tags", err);
  }
};

const attachNewL2TagsWithL1Tags = async (
  l2tags,
  currentlyFetchedL1Tags = []
) => {
  // console.log(
  //   colors.bold.bgRed.yellow(
  //     "second .... wait... attaching the Level tags with their parent IDs...."
  //   )
  // );
  const l2TagsWithParentId = [];
  l2tags &&
    l2tags.forEach((x, idx) => {
      currentlyFetchedL1Tags.forEach((y, yidx) => {
        x[0].trim().toLowerCase() === y.name.trim().toLowerCase() &&
          l2TagsWithParentId.push({
            type: "LEVEL2",
            name: x[1],
            parentId: y.id,
          });
      });
    });
  // console.table(colors.bold.bgRed.yellow(l2TagsWithParentId));
  // console.log(
  //   colors.bold.bgBlue.white(
  //     "Total of ",
  //     l2TagsWithParentId.length,
  //     "Level-2 tags have been attached with it's parent-id"
  //   )
  // );
  return l2TagsWithParentId;
};

const work = async () => {
  // console.log(colors.bgBlue.yellow(".... program starts ...."));
  try {
    const { code, status, error, data } = await getL1Tags(L1TagsUrl);
    if (!error) {
      // console.log(
      //   colors.bold.bgCyan.red("fetched l1 tags", data.LEVEL1.length)
      // );
      const exisitingL2Tags = await getL2Tags(L2TagsUrl);
      const verifiedNewL2Tags = await verifyL2Tags(exisitingL2Tags.data.LEVEL2);
      const l2TagsReadyToSend = await attachNewL2TagsWithL1Tags(
        verifiedNewL2Tags,
        data.LEVEL1
      );
      const { totalL2Tags, success, errorMessage } = await postL2Tags(
        postL2TagsUrl,
        l2TagsReadyToSend
      );
      if (!success) {
        // console.log(
        //   "there is some error while posting level-2 tags",
        //   errorMessage
        // );
      } else {
        console.log(
          "you successfully posted ",
          totalL2Tags.length,
          " Level-2 tags"
        );
      }
    }
    // console.log(colors.bgBlue.yellow(".... program ends ...."));
  } catch (err) {
    console.log(err);
  }
};

work();
