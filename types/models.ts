export interface DatabaseCertificate {
  name: string
}

export interface DatabseProduct {
  id: string,
  prodName: string,
  longDescription: string,
  shortDescription: string,
  fl: string,
  prodImage: string,
  url: string,
  brand: string,
  fscUrl: string,
  epdUrl: string,
  vocUrl: string,
  ceUrl: string,
  certificates: Array<DatabaseCertificate>
}