export interface TestControllerProduct {
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
    certificates: [
        { name: string, val: string },
        { name: string, val: string },
        { name: string, val: string },
        { name: string, val: string },
        { name: string, val: string },
        { name: string, val: string },
        { name: string, val: string },
        { name: string, val: string },
        { name: string, val: string },
    ]
}

export interface allProducts {
    obj: Array<TestControllerProduct>,
    length: number
}
  
export interface validDateObj {
    message: string,
    date ?: Date 
}
  