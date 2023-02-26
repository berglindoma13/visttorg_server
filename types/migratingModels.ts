export interface MigratingProduct {
  id?: string
  productid: string,
  title: string,
  description: string,
  shortdescription: string,
  categories: string | Array<ConnectedCategory>,
  subCategories: Array<ConnectedSubCategory>,
  productimageurl: string,
  url: string,
  brand: string,
  fscUrl: string,
  epdUrl: string,
  vocUrl: string,
  ceUrl: string,
  certificates: Array<MigratingCertificate>
}

export interface ProductWithExtraProps {
  approved: boolean
  certChange: boolean
  create: boolean
  product: MigratingProduct
  productState: number
  validDate: Array<ValidDateObj>
  validatedCertificates: Array<MigratingCertificate>
}

export interface MigratingCertificate {
  name: string
}

export interface MigratingProductCertificate {
  name: string
  fileurl: string
  validDate?: Date
  productId: string
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

export interface CategoryMapperItem {
  name: string
  items: Array<string>
  subCategories: Array<SubCategoryMapperItem>
}

interface SubCategoryMapperItem {
  name: string
  items: Array<string>
}