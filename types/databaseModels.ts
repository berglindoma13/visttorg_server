export interface DatabaseProduct {
  productid: string,
  title: string,
  companyid: number
  sellingcompany?: DatabaseCompany
  description: string,
  shortdescription: string,
  categories: Array<DatabaseCategory>,
  subCategories: Array<ConnectedSubCategory>,
  productimageurl: string,
  url: string,
  brand: string,
  certificates: Array<DatabaseProductCertificate>
  certificateSystems?: Array<DatabaseCertificateSystem>
}

export interface DatabaseCompany {
  name: string
  websiteurl: string
  email: string
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
  certificateId: number
  certificate: DatabaseCertificate
  connectedProduct: DatabaseProduct
}

export interface DatabaseCategory {
  name: string
  subCategories?: Array<DatabaseSubCategory>
  products: Array<DatabaseProduct>
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

export interface DatabaseCertificateSystem {
  name: string
}

export interface DatabaseCertificate {
  id: number
  name: string
}

