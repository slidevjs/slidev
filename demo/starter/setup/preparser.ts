import { definePreparserSetup } from '@slidev/types'
import { red } from 'kolorist'

export default definePreparserSetup(() => {
    return [
        {
            lintSlide(slide) {
                if(slide.note?.length > 500 ){
                    console.warn(red("[slidev-lint] Long text passage in slide "+slide.index+", "+slide.note?.length+" chars, might overflow handout"))
                }
            },
        },
    ]
})