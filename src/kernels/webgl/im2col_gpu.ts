/**
 * @license
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import {Conv2DInfo} from '../../ops/conv_util';
import {GPGPUProgram} from './gpgpu_math';

export class Im2ColProgram implements GPGPUProgram {
  variableNames = ['A'];
  outputShape: number[];
  userCode: string;

  constructor(outputShape: number[], inputShape: number[], convInfo: Conv2DInfo) {
    this.outputShape = outputShape;

    const filterWidth = convInfo.filterWidth;
    const inChannels = convInfo.inChannels;

    const inputWidth = inputShape[1];
    // const inputHeight = inputShape[0];
    const numBlocksAcross = inputWidth - filterWidth;
    const itemsPerFilterRow = inChannels * inputWidth;

    this.userCode = `
      void main() {
        ivec2 rc = getOutputCoords();

        // int r = rc.x;
        // int c = rc.y;
        // int rp1 = r + 1;
        // int cp1 = c + 1;

        // bool cEdge = cp1 >= ${outputShape[1]};
        // bool rEdge = rp1 >= ${outputShape[0]};

        // gl_FragColor = vec4(
        //     getA(r, c),
        //     cEdge ? 0. : getA(r, cp1),
        //     rEdge ? 0. : getA(rp1, c),
        //     rEdge || cEdge ? 0. : getA(rp1, cp1)
        //   );


        int blockIndex = rc.x;
        int pos = rc.y;
        int offsetY = int(blockIndex / (${numBlocksAcross}));
        float offsetX = mod(float(blockIndex), ${numBlocksAcross}.);

        int d2 = int(mod(float(pos), ${inChannels}.));
        int d1 = int(pos / ${itemsPerFilterRow});
        int d0 = int((mod(float(pos), ${itemsPerFilterRow}.) / ${inChannels}.));

        gl_FragColor = vec4(
          getA(d0 + int(offsetX), d1 + int(offsetY), d2)
        );
      }
    `;
  }
}
