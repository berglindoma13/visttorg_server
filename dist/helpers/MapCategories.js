"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMappedCategorySub = exports.getMappedCategory = void 0;
// export const getMappedCategory = (categoryList: Array<string>, mapper: any) => {
//   const matchedCategory: Array<ConnectedCategory> = []
//   return new Promise((resolve : (value: Array<ConnectedCategory>) => void, reject) => {
//     for (const cat in mapper) {
//       for(const productCategory in categoryList){
//         //@ts-ignore
//         if(mapper[cat].includes(categoryList[productCategory])){
//           matchedCategory.push({name: cat})
//         }
//       }
//     }
//     resolve(matchedCategory)
//   })
// }
const getMappedCategory = (categoryList, mapper) => {
    const mappedCategories = [];
    categoryList.map(cat => {
        mapper.map(mapItem => {
            if (mapItem.items.includes(cat)) {
                mappedCategories.push({ name: mapItem.name });
            }
        });
    });
    return mappedCategories;
};
exports.getMappedCategory = getMappedCategory;
const getMappedCategorySub = (categoryList, mapper) => {
    const mappedSubCategories = [];
    categoryList.map(cat => {
        mapper.map(mapItem => {
            mapItem.subCategories.map(subCatMap => {
                if (subCatMap.items.includes(cat)) {
                    mappedSubCategories.push({ subCatIdentifier: { name: subCatMap.name, parentCategoryName: mapItem.name } });
                }
            });
        });
    });
    return mappedSubCategories;
};
exports.getMappedCategorySub = getMappedCategorySub;
