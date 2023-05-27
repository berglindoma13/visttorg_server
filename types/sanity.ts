export interface SanityCertificateReference {
  _key?: string,
  _ref: string,
  _type: string
}

export interface SanityCertificateListItem {
  Certificates: Array<SanityCertificateReference>
  CompanyName: string
  _id: string
  _type: string
  _updatedAt: string
}

export interface SanityCertificate {
   _id: string
  _type: string
  _updatedAt: string
  certfileurl: string
  productid: string
  validdate?: string
}