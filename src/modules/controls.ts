import { UserModule } from '../types'
import { createNavigateControls } from '../logic/controls'

export const install: UserModule = ({ app, router }) => {
  app.use(createNavigateControls(router))
}
