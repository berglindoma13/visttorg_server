export interface BykoCertificate {
  cert : string
}

export interface BykoProduct{
  id: string
  axId : string,
  prodName : string,
  shortDescription : string,
  longDescription : string,
  brand : string,
  prodImage : string,
  prodTypeParent : string,
  prodType : string,
  groupName : string,
  url : string,
  fscUrl : string,
  epdUrl : string,
  vocUrl : string,
  certificates : Array<BykoCertificate>
}

export interface BykoResponseData {
  currPageNum : number,
  pageSize : number,
  totalPageCount : number, 
  isLastPage : boolean,
  prodCnt : number,
  productList : Array<BykoProduct>
}