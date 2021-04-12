import { createNavigateControls } from '~/logic/controls'
import { UserModule } from '~/types'

export const install: UserModule = ({ app, router }) => {
  app.use(createNavigateControls(router))
}
