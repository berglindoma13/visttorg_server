import { validateEmail } from '../utils/emailValidation'
import prismaInstance from '../lib/prisma'

export const Postlist = async (req: any, res: any): Promise<void> => {

  const {
    postlistEmail = '',
  } = req.body


  if (!postlistEmail) {

    return res.status(400).send('Vantar tölvupóst')
  }

  if (!validateEmail(postlistEmail)) {

    return res.status(400).send('Netfang ekki gilt')
  }

  await prismaInstance.postlist.create({
    data: {
      email: postlistEmail
    }
  })

  return res.status(200).send('success')
}


export const PostlistUnsubscribe = async (req: any, res: any): Promise<void> => {

  const {
    postlistEmail = '',
  } = req.query

  console.log('req.query', req.query)
  console.log('req.body', req.body)

  if (!postlistEmail) {
    return res.status(400).send('Vantar tölvupóst')
  }

  if (!validateEmail(postlistEmail)) {
    return res.status(400).send('Netfang ekki gilt')
  }

  await prismaInstance.postlist.deleteMany({
    where: {
      email: postlistEmail
    }
  })

  return res.status(200).send('success')
}