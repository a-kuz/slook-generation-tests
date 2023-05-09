import axios, { AxiosResponse } from "axios";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { samplers } from "./samplers";
const mask = readFileSync("./mask.jpg.base64").toString();
const initImage = readFileSync("./initImage.png.base64").toString();
const startUrl = "https://dev-ai-runpod.superlook.workers.dev/start";
const statusUrl = "https://dev-ai-runpod.superlook.workers.dev/status";
const steps = 2;
const prompt = "office man";
const sampler_index = samplers["Euler a"];
const reqCount = 3;

interface Task {
  i: number;
  id: string;
  startReq?: string;
  beforeStartReq: number;
  startReqDuration?: number;
  status?: string;
  endTime?: number;
  totalTime?: number;
  executionTime?: number;
  delayTime?: number;
}


async function runTest() {
  let data = sd_params();

  let config = {
    method: "post",
    timeout: 0,
    maxBodyLength: Infinity,
    url: startUrl,
    headers: {
      "Content-Type": "application/json",
      
    },
    data,
  };

  const d = new Date();
  const strDate = d.toJSON().slice(0, 13);
  const dir = `./images/${strDate}-${prompt.replace(":", "__")}`;
  if (!existsSync(dir)) {
    mkdirSync(dir);
  }

  const tasks: Task[] = [];
  for (let i = 0; i < reqCount; i++) {
    const beforeStartReq = Date.now();

    axios
      .request(config)
      .then(async (response) => {
        console.log(response.data);
        tasks.push({
          i,
          id: response.data.payload.id,
          beforeStartReq,
          startReq: new Date().toJSON().slice(11, 19),
          startReqDuration:
            Math.floor((Date.now() - beforeStartReq) / 100) / 10,
        });
      })
      .catch((error) => {
        console.error(error);
      });
  }

  let allOk = false;
  let countOk = 0;

  const check = async () => {
    allOk = false;
    countOk = 0;
    const promises = [];
    for (const task of tasks) {
      if (task.status === "COMPLETED") {
        countOk++;
        continue;
      }

      const checkTask = async (task: Task) => {
        const id = task.id;
        data = JSON.stringify({ id });
        try {
          config = {
            method: "post",
            timeout: 0,
            maxBodyLength: Infinity,
            url: statusUrl,
            headers: {
              "Content-Type": "application/json",
              
            },
            data,
          };
          const status: AxiosResponse<{
            payload: {
              status: string;
              delayTime: number;
              executionTime: number;
images: string[]
            };
            errors: string[];
          }> = await axios.request(config);
          
    //   console.log(JSON.stringify(response.data));
  
  

          task.status = status.data?.payload?.status || task.status;

          if (status.data?.errors?.length) console.error(status.data.errors);

          console.log(
            `${new Date().toJSON()} ${id} ${status.data.payload.status} `
          );
          if (task.status === "COMPLETED") {
            saveResult(status.data.payload.images, task.id);
            task.endTime = Date.now();
            task.executionTime =
              Math.round(status.data.payload.executionTime / 100) / 10;
            task.delayTime =
              Math.round(status.data.payload.delayTime / 100) / 10;
            task.totalTime =
              Math.round((task.endTime - task.beforeStartReq) / 100) / 10;
            countOk++;
          } else {
            allOk = false;
          }
        } catch (e: unknown) {
          allOk = false;
          console.error((e as Error).message);
        }
      };
      promises.push(checkTask(task));
    }
    await Promise.all(promises);
    if (countOk < reqCount) setTimeout(check, 500);
    console.table(
      tasks.map((e) => ({
        startTime: e.startReq,
        startReqDuration: e.startReqDuration,
        totalTime: e.totalTime,
        executionTime: e.executionTime,
        delayTime: e.delayTime,
      }))
    );
  };

  if (countOk < reqCount) setTimeout(check, 1000);

  console.table(tasks);
}

runTest();

function saveResult(images: string[], id:string) {
  const d = new Date();
  const strDate = d.toJSON().slice(0, 13);
  const dir = `./images/${strDate}`;
  if (!existsSync(dir)) {
    mkdirSync(dir);
  }


  let i = 0;
  for (let image of images) {
    i++;
    writeFileSync(`${dir}/${id}.png`, Buffer.from(image, "base64"));
  }
}

function sd_params() {
  return JSON.stringify({
    init_images: [initImage],
    mask,
    steps,
    prompt,
    negative_prompt:
      "ugly, tiling, poorly drawn hands, poorly drawn feet, poorly drawn face, out of frame, extra limbs, disfigured, deformed, body out of frame, bad anatomy, watermark, signature, cut off, low contrast, underexposed, overexposed, bad art, beginner, amateur, distorted face",
    styles: [],
    sampler_index,
    mask_blur: 4,
    mask_alpha: 0,
    inpainting_fill: 1,
    restore_faces: false,
    tiling: false,
    n_iter: 1,
    batch_size: 4,
    cfg_scale: 7.5,
    image_cfg_scale: 1.5,
    denoising_strength: 0.85,
    seed: -1,
    subseed: -1.0,
    subseed_strength: 0,
    seed_resize_from_h: 0,
    seed_resize_from_w: 0,
    seed_enable_extras: false,
    resize_mode: 0,
    inpaint_full_res: 0,
    inpaint_full_res_padding: 32,
    inpainting_mask_invert: 0,
    override_settings_texts: 0,
  });
}
