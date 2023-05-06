
import axios from 'axios'
import { randomUUID} from 'crypto'
import { mkdirSync } from 'fs'
import { existsSync } from 'fs'
import { fstatSync, readFileSync, writeFileSync } from 'fs'
import { samplers } from './samplers'
const mask = readFileSync('./mask.jpg.base64').toString()
const initImage = readFileSync('./initImage.png.base64').toString()
const url = 'https://lookmybest-main.hf.space/sdapi/v1/img2img';
const steps = 35;
const prompt = "office man";
// const sampler_index = 'DPM2 a Karras';
const sampler_index = samplers['DPM2 a Karras'];

async function u() {
for (let steps = 1; steps < 35; steps++) {
let data = JSON.stringify({
  init_images: [initImage
  ],
  mask,
  steps,
  prompt,
  negative_prompt: "ugly, tiling, poorly drawn hands, poorly drawn feet, poorly drawn face, out of frame, extra limbs, disfigured, deformed, body out of frame, bad anatomy, watermark, signature, cut off, low contrast, underexposed, overexposed, bad art, beginner, amateur, distorted face",
  "styles": [],
  sampler_index,
  "mask_blur": 4,
  "mask_alpha": 0,
  "inpainting_fill": 1,
  "restore_faces": false,
  "tiling": false,
  "n_iter": 1,
  "batch_size": 4,
  "cfg_scale": 7.5,
  "image_cfg_scale": 1.5,
  "denoising_strength": 0.85,
  "seed": 1,
  "subseed": -1.0,
  "subseed_strength": 0,
  "seed_resize_from_h": 0,
  "seed_resize_from_w": 0,
  "seed_enable_extras": false,
  "resize_mode": 0,
  "inpaint_full_res": 0,
  "inpaint_full_res_padding": 32,
  "inpainting_mask_invert": 0,
  "override_settings_texts": 0

});

let config = {
  method: 'post',
  timeout: 0,
  maxBodyLength: Infinity,
  url,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer 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'
  },
  data
};

const d = new Date();
const strDate = d.toJSON().slice(0,13);
const dir = `./images/${strDate}-${prompt.replace(':','__')}`
if (!existsSync(dir)) {
  mkdirSync(dir);
}
  
const time =Date.now();
await axios.request(config)
  .then((response) => {
    console.log(response.status)
    console.log(Math.floor((Date.now() - time)/1000))

    let i=0;
    for (let image of response.data.images) {
      i++;
      writeFileSync(`${dir}/${steps}-${sampler_index}-${i}.png`, Buffer.from(image, 'base64'))

    }
    //   console.log(JSON.stringify(response.data));
  })
  .catch((error) => {
    console.log(error);
  });
}
} 
u()