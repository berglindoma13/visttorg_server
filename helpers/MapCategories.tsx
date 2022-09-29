import { ConnectedCategory } from "../types/models"

export const getMappedCategory = (categoryList: Array<string>, mapper: any) => {
  const matchedCategory: Array<ConnectedCategory> = []
  return new Promise((resolve : (value: Array<ConnectedCategory>) => void, reject) => {
    for (const cat in mapper) {
      for(const productCategory in categoryList){
        //@ts-ignore
        if(mapper[cat].includes(categoryList[productCategory])){
          matchedCategory.push({name: cat})
        }
      }
    }
    resolve(matchedCategory)
  })
}