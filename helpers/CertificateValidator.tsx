import { DatabaseCertificate } from '../types/models'

interface CertificateValidatorProps {
  certificates: Array<DatabaseCertificate>
  epdUrl?: string
  fscUrl?: string
  vocUrl?: string
  ceUrl?: string
}

export const CertificateValidator = ({ certificates, epdUrl, fscUrl, vocUrl, ceUrl } : CertificateValidatorProps) : Array<DatabaseCertificate> => {

  const ValidCertificates: Array<DatabaseCertificate> = []

  certificates.map((certificate: DatabaseCertificate) => {
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
      case 'BREEAM':
        ValidCertificates.push({ name: 'BREEAM'})
        break;
      case 'BLENGILL':
        ValidCertificates.push({ name: 'BLENGILL'})
        break;
      case 'EV':
        ValidCertificates.push({ name: 'EV'})
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

