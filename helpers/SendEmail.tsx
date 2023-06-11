import prismaInstance from "../lib/prisma"
import sendgrid from '@sendgrid/mail';
    
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

interface InvalidEmailTemplateDataProps {
    name: string
    productList: string
}

export const SendEmailAPI = async(req: any, res: any) => {
    GetInvalidProductsAndSendEmail();
    return res.status(200).send('email sent')
}

export const SendEmailToCompanies = async() => {
    GetInvalidProductsAndSendEmail()
}

const GetInvalidProductsAndSendEmail = async() => {

    const filterValidDate = (val) => {
        if(val.certificateid === 1 || val.certificateid === 2 || val.certificateid === 3) {
            return val.validDate == null || val.validDate < new Date()
        }
        else {
          return false
        }
    }

    // get all products and their certificates
    const AllProducts = await prismaInstance.product.findMany({
        include:{
          certificates: {
            include: {
              certificate : true
            }
          }
        }
    })

    // get all companies
    const Companies = await prismaInstance.company.findMany()

    // remove valid certificates from product and only leave the invalid ones
    const filteredProductList = AllProducts.map(prod => {
        const filteredCertificates = prod.certificates.filter(filterValidDate)
        prod.certificates = filteredCertificates;
        return prod
    })

    const invalidProducts = []
    // get the products with invalid certificates and add them to a new array
    filteredProductList.filter(prod => {
        if(prod.certificates.length > 0) {
            // get only the name of the invalid certificate for each product
            const invalCerts = prod.certificates.map(cert => {
                const item = { name: cert.certificate.name, url: cert.fileurl }
                
                return item
            })
            invalidProducts.push({compid: prod.companyid, name: prod.title, invalidCertificates: invalCerts})
        }
    })

    const invalidProductsByCompany  = []
    Companies.map(comp => {
        var comp_invalidproducts: Array<InvalidEmailTemplateDataProps> = []
        invalidProducts.map(prod => {
            if (comp.id == prod.compid) {
                // push the name of the product along with the name of the invalid certificates for that product
                let name = `Nafn: ${prod.name}`;
                let productList = `Ógild vottunarskjöl: ${prod.invalidCertificates.map(i => { return (`${i.name}(${i.url}), `)})}`
                comp_invalidproducts.push({ name, productList})
            }
        })
        invalidProductsByCompany.push({compid: comp.id, products: comp_invalidproducts, to: comp.contact });
    })

    // send email to companies with invalid products
    invalidProductsByCompany.map((company, index) => {
        if(company.products.length !== 0) {
            index === 0 && SendEmail(company.products, company.to)
            console.log('company', company)
        } 
    })

}


const SendEmail = async(productlist, emailTo) => {

    //Template Dynamic ID
    //d-4688dd864978442fb009e5957529d545

    const options = {
        personalizations: [
            {
              to: 'berglind@visttorg.is',
              subject: 'Hello recipient 1',
              dynamicTemplateData: {
                productList: productlist.map((x: InvalidEmailTemplateDataProps) => { return { "itemName": x.name, "invalidList": x.productList }} )
              },
            },
          ],
          from: 'vistbok@visttorg.is',
          templateId: 'd-4688dd864978442fb009e5957529d545',

    };
    
    sendgrid.send(options);SendEmail
}