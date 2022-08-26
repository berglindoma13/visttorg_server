export const validateEmail = (email: string): boolean => {
  // eslint-disable-next-line max-len
  // eslint-disable-next-line no-useless-escape
  const re = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
  return re.test(String(email).toLowerCase())
}
