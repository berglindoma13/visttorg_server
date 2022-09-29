"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMappedCategory = void 0;
const getMappedCategory = (categoryList, mapper) => {
    const matchedCategory = [];
    return new Promise((resolve, reject) => {
        for (const cat in mapper) {
            for (const productCategory in categoryList) {
                //@ts-ignore
                if (mapper[cat].includes(categoryList[productCategory])) {
                    matchedCategory.push({ name: cat });
                }
            }
        }
        resolve(matchedCategory);
    });
};
exports.getMappedCategory = getMappedCategory;
