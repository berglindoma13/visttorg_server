export interface DatabaseCertificate {
  name: string
}

export interface DatabaseProduct {
  id: string,
  prodName: string,
  longDescription: string,
  shortDescription: string,
  fl: string | Array<ConnectedCategory>,
  subFl: Array<ConnectedSubCategory>,
  prodImage: string,
  url: string,
  brand: string,
  fscUrl: string,
  epdUrl: string,
  vocUrl: string,
  ceUrl: string,
  certificates: Array<DatabaseCertificate>
}

export interface ConnectedCategory {
  name: string
}

export interface ConnectedSubCategory {
  subCatIdentifier: bla
}

interface bla {
  name: string
  parentCategoryName: string
}

export interface ProductWithPropsProps {
  approved: boolean
  certChange: boolean
  create: boolean
  product:DatabaseProduct
  productState: number
  validDate: Array<ValidDateObj>
  validatedCertificates: Array<DatabaseCertificate>
}

export interface ValidDateObj {
  message: string,
  date ?: Date 
}

export interface DatabaseProductCertificate {
  id?: number
  validDate?: Date
  name: string
  fileurl: string
  productId: string
}

export interface DatabaseCategory {
  name: string
  subCategories?: Array<DatabaseSubCategory>
}

export interface DatabaseSubCategory {
  name: string
}

export interface CategoryMapperItem {
  name: string
  items: Array<string>
  subCategories: Array<SubCategoryMapperItem>
}

interface SubCategoryMapperItem {
  name: string
  items: Array<string>
}