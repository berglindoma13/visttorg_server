"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificateValidator = void 0;
const CertificateValidator = ({ certificates, epdUrl, fscUrl, vocUrl, ceUrl }) => {
    const ValidCertificates = [];
    certificates.map((certificate) => {
        switch (certificate.name) {
            case 'EPD':
                if (!!epdUrl) {
                    ValidCertificates.push({ name: 'EPD' });
                }
                break;
            case 'FSC':
                if (!!fscUrl) {
                    ValidCertificates.push({ name: 'FSC' });
                }
                break;
            case 'VOC':
                if (!!vocUrl) {
                    ValidCertificates.push({ name: 'VOC' });
                }
                break;
            case 'SV_ALLOWED':
                ValidCertificates.push({ name: 'SV_ALLOWED' });
                break;
            case 'SV':
                ValidCertificates.push({ name: 'SV' });
                break;
            case 'BREEAM':
                ValidCertificates.push({ name: 'BREEAM' });
                break;
            case 'BLENGILL':
                ValidCertificates.push({ name: 'BLENGILL' });
                break;
            case 'EV':
                ValidCertificates.push({ name: 'EV' });
                break;
            // case 'CE':
            //     if(!!ceUrl){ValidCertificates.push({ name: 'CE'})}
            //     break;
            default:
                break;
        }
    });
    return ValidCertificates;
};
exports.CertificateValidator = CertificateValidator;
