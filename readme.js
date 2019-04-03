/**
 * tallbag-merge
 * -------------
 *
 * Tallbag factory that merges data from multiple tallbag sources. Works well
 * with listenable sources, and while it may work for some pullable sources,
 * it is only designed for listenable sources.
 *
 * `npm install tallbag-merge`
 *
 * Example:
 *
 *     const interval = require('callbag-interval');
 *     const forEach = require('callbag-for-each');
 *     const merge = require('tallbag-merge');
 *
 *     const source = merge(interval(100), interval(350));
 *
 *     forEach(x => console.log(x))(source); // 0
 *                                           // 1
 *                                           // 2
 *                                           // 0
 *                                           // 3
 *                                           // 4
 *                                           // 5
 *                                           // ...
 */

import makeShadow from 'shadow-callbag';

function merge(...sources) {
  return (start, sink) => {
    if (start !== 0) return;
    const n = sources.length;
    const sourceShadows = new Array(n);
    const sourceTalkbacks = new Array(n);
    let shadow;
    let startCount = 0;
    let endCount = 0;
    let ended = false;
    const talkback = (t, d) => {
      if (t === 2) ended = true;
      for (let i = 0; i < n; i++)
        sourceTalkbacks[i] && sourceTalkbacks[i](t, d);
    };
    for (let i = 0; i < n; i++) {
      if (ended) return;
      sources[i](0, (t, d, s) => {
        if (t === 0) {
          sourceShadows[i] = s;
          sourceTalkbacks[i] = d;
          if (++startCount === 1) {
            shadow = makeShadow('merge', sourceShadows);
            sink(0, talkback, shadow);
          }
        }

        if (t === 1) {
          shadow(1, d);
          sink(1, d);
        }

        if (t === 2) {
          if (!!d) {
            ended = true;
            for (let j = 0; j < n; j++) {
              if (j !== i) sourceTalkbacks[j] && sourceTalkbacks[j](2);
            }
            sink(2, d);
          } else {
            sourceTalkbacks[i] = void 0;
            if (++endCount === n) sink(2);
          }
        }
      });
    }
  };
}

export default merge;
