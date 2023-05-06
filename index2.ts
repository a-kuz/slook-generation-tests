
import axios from 'axios'
import sharp from 'sharp'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'

import sd, {ControlNetUnit} from 'stable-diffusion-api'

const baseUrl = 'http://localhost:7860';
const steps = 20;

const initImage = sharp('initImage.png')
const mask = sharp('./mask.jpg')


const api = new sd({
  baseUrl,
  defaultStepCount: steps,
  defaultSampler:'Eauler a',
});

const controlNetUnit = new ControlNetUnit({
  model: "control_v11p_sd15_openpose",
  module: "openpose",
  input_image: initImage,
  processor_res: 512,
  threshold_a: 64,
  threshold_b: 64,
});

let data = api.img2img({
  controlnet_units:[controlNetUnit],mask_image: mask,
  
  steps,
  prompt: "office man (hyperrealistic:10)",
  negative_prompt: "ugly, tiling, poorly drawn hands, poorly drawn feet, poorly drawn face, out of frame, extra limbs, disfigured, deformed, body out of frame, bad anatomy, watermark, signature, cut off, low contrast, underexposed, overexposed, bad art, beginner, amateur, distorted face",
  "styles": [],  
  "mask_blur": 4,
  
  "inpainting_fill": 1,
  "restore_faces": false,
  "tiling": false,
  "n_iter": 1,
  "batch_size": 20,
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
const dir = `./images/${strDate}`
if (!existsSync(dir)) {
  mkdirSync(dir);
}
  

axios.request(config)
  .then((response) => {
    //console.log(response)
    let i=0;
    for (let image of response.data.images) {
      i++;
      writeFileSync(`${dir}/${steps}-${i}.png`, Buffer.from(image, 'base64'))

    }
    //   console.log(JSON.stringify(response.data));
  })
  .catch((error) => {
    console.log(error);
  });
