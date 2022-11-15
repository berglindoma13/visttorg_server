export interface DatabaseCertificate {
  name: string
}

export interface DatabaseCertificateSystem {
  name: string
}

export interface DatabaseCompany {
  name: string
  websiteurl: string
  email: string
}


export interface DatabaseProduct {
  productid: string,
  title: string,
  description: string,
  shortdescription: string,
  categories: string | Array<ConnectedCategory>,
  subCategories: Array<ConnectedSubCategory>,
  sellingcompany?: DatabaseCompany
  productimageurl: string,
  url: string,
  brand: string,
  fscUrl: string,
  epdUrl: string,
  vocUrl: string,
  ceUrl: string,
  certificates: Array<DatabaseCertificate>
  certificateSystems?: Array<DatabaseCertificateSystem>
}

export interface ConnectedCategory {
  name: string
}

export interface ConnectedSubCategory {
  subCatIdentifier: ConnectedSubCatIdentifier
}

export interface ConnectedCertificateSystem {
  name: string
}

interface ConnectedSubCatIdentifier {
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