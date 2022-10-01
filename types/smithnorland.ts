export interface SmithNorlandProduct {
  id: string,
  title?: string,
  long_description: string,
  short_description: string,
  url: string,
  vottun: string
  brand: string
  category: Array<string>
  images: Array<string>
  vottunarskjol: Array<string>
}

export interface SmithNorlandResponse {
  products: Array<SmithNorlandProduct>
}