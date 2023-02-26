import { CategoryMapperItem, ConnectedCategory, ConnectedSubCategory } from "../types/databaseModels"

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

export const getMappedCategory = (categoryList: Array<string>, mapper: Array<CategoryMapperItem>) => {
  
  const mappedCategories: Array<ConnectedCategory> = []
  
  categoryList.map(cat => {
    mapper.map(mapItem => {
      if(mapItem.items.includes(cat)){
        mappedCategories.push({ name : mapItem.name })
      }
    })  
  })

  return mappedCategories
}

export const getMappedCategorySub = (categoryList: Array<string>, mapper: Array<CategoryMapperItem>) => {
  
  const mappedSubCategories: Array<ConnectedSubCategory> = []  
  categoryList.map(cat => {
    mapper.map(mapItem => {
      mapItem.subCategories.map(subCatMap => {
        if(subCatMap.items.includes(cat)){
          mappedSubCategories.push( { subCatIdentifier: { name : subCatMap.name, parentCategoryName: mapItem.name }})
        }
      })
    })  
  })

  return mappedSubCategories
}