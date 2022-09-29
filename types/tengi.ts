export interface TengiProduct {
  Id: string,
  SourceCompanyId?: string,
  CompanyId: string,
  IsMaster: boolean,
  HasChildren: boolean,
  StandardFields: StandardFields,
  SEO: SEO,
  CustomFields: CustomFields
  Images: Array<Images>
  Attachments: Array<Attachments>
  VariationOptions: Array<VariantOptions>,
  Variants: Array<Variants>,
  Attributes: Attributes,
  CreatedFromUI: boolean
}

export interface TengiResponse {
  Result: boolean,
  Messages: Array<any>,
  Data: Array<TengiProduct>
}


interface PriceItem{
  Type: number,
  TypeDescription: string,
  PriceId: string,
  Price: number,
  SalePrice?: number,
  CurrencyCode:string
}

interface StandardFields {
  SKU: string,
  Name: string,
  Prices: Array<PriceItem>,
  PriceModDateTime: string
  StockType: number
  Inventory: Array<InventoryItem>
  InventoryModDateTime: string
  ImagesModDateTime: string
  ShortDescription: string
  Description: string
  CreateDateTime: string
  ModDateTime: string
  ModifiedBy: string
  CreatedBy: string
  IsOnSale: boolean
  Status: string
  StatusModDateTime: string
  Categories: Array<CategoryItem>
  Brands: Array<BrandItem>
  Collections: Array<any>
  ProductTypes: Array<any>
  Tags: Array<any>
  Specifications: Array<any>
}

interface CategoryItem {
  Depth: number,
  HasChildren: boolean,
  Id: string,
  Name: string,
  ParentId: string,
  ParentName?: string
}

interface BrandItem {
  Depth: number,
  HasChildren: boolean,
  Id: string,
  Name: string,
  ParentId: string,
  ParentName?: string
}

interface InventoryItem{
  Type: number,
  TypeDescription: string,
  StockType: number,
  StockTypeDescription: string,
  Name: string,
  LocationId: string,
  Qty: number
}

interface SEO {
  Title?: string,
  Description?: string,
  Keywords: Array<string>
}

interface CustomFields {
  VAT_Prod_Posting_Group: string,
  Inventory_Posting_Group: string,
  SpecialOrder: boolean,
  BackOrder: boolean,
  Flokkur: string,
  Lengd: string,
  Breidd: string,
  Framleiðandi: string,
  Stærð: string,
  Gerð: string,
  Áferð: string,
  Innanmál: string,
  Þykkt: string,
  Gengjumál: string,
  Flæði: string,
  Þvermál: string,
  Dýpt: string,
  Magn_í_pakkningu: string,
  Magn_í_kassa: string,
  ProductUrl: string,
  Item_Category_Code: string,
  Item_Disc_Group: string
}

interface Images {
  ThumbnailUrl: string
  OptimizedUrl: string
  Dimensions: string
  Featured: boolean,
  Url: string
  Name: string
  Filesize: string
  CreateDateTime: string
  ModDateTime: string
  ModifiedBy: string
  CreatedBy: string
  Hash: string
  CreatedFromUI: boolean,
  Removed: boolean
}

interface Attachments {
  DisplayName: string,
  Type: string,
  Url: string
  Name: string
  Filesize: string
  CreateDateTime: string
  ModDateTime: string
  ModifiedBy: string
  CreatedBy: string
  Hash: string
  CreatedFromUI: boolean,
  Removed: boolean
}

interface VariantOptions {

}

interface Variants {

}

interface Attributes {

}