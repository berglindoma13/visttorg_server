import { DatabaseProduct } from '../types/databaseModels'
import { ConnectedCertificateSystem, MigratingCertificate } from '../types/migratingModels'

interface CertificateValidatorProps {
  certificates: Array<MigratingCertificate>
  epdUrl?: string
  fscUrl?: string
  vocUrl?: string
  ceUrl?: string
}

export const CertificateValidator = ({ certificates, epdUrl, fscUrl, vocUrl, ceUrl } : CertificateValidatorProps) : Array<MigratingCertificate> => {

  const ValidCertificates: Array<MigratingCertificate> = []

  certificates.map((certificate: MigratingCertificate) => {
    switch(certificate.name) {
      case 'EPD':
        if(!!epdUrl){ValidCertificates.push({ name: 'EPD'})}
        break;
      case 'FSC':
        if(!!fscUrl){ValidCertificates.push({ name: 'FSC'})}
        break;
      case 'VOC':
        if(!!vocUrl){ValidCertificates.push({ name: 'VOC'})}
        break;
      case 'SV_ALLOWED':
        ValidCertificates.push({ name: 'SV_ALLOWED'})
        break;
      case 'SV':
        ValidCertificates.push({ name: 'SV'})
        break;
      // case 'BREEAM':
      //   if(!!epdUrl || !!vocUrl || !!fscUrl){ValidCertificates.push({ name: 'BREEAM'})}
      //   break;
      case 'BLENGILL':
        ValidCertificates.push({ name: 'BLENGILL'})
        break;
      case 'EV':
        ValidCertificates.push({ name: 'EV'})
        break;

      case 'ENERGY':
        ValidCertificates.push({ name: 'ENERGY'})
        break;
      // case 'CE':
      //     if(!!ceUrl){ValidCertificates.push({ name: 'CE'})}
      //     break;
      default:
        break;
    }
  })

  return ValidCertificates
}

//1 = BREEAM

export const mapToCertificateSystem = (prod) => {
  const systemArray: Array<ConnectedCertificateSystem> = []

  //const BREEAMcerts = prod.certificates.filter(cert => (cert.certificateid === 1 && cert.validDate !== null) || (cert.certificateid === 2 && cert.validDate !== null) || (cert.certificateid === 3 && cert.validDate !== null))
  const BREEAMcerts = prod.certificates.filter(cert => cert.name === 'EPD' || cert.name === 'FSC' || cert.name === 'VOC')

  if(BREEAMcerts.length > 0){
    systemArray.push({ name: 'BREEAM' })
  }

  return systemArray
}

