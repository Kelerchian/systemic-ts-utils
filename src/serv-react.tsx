// /* eslint-disable react-hooks/rules-of-hooks */
// import { useEffect, useState, useContext, createContext, useMemo } from "react";
// import { Serv, Obs } from "./serv";

// export { Serv, Obs } from "./serv";

// export namespace ServReact {
//   const DEFAULT_SYMBOL = Symbol();

//   export class ServReactContextError extends Error {
//     constructor(message?: string) {
//       super(message);
//       this.name = "ServReactContextError";
//     }
//   }

//   export namespace Context {
//     export const make = <S extends Serv<any, any>>() => {
//       const SC = createContext<S | null>(null);
//       const borrow = () => {
//         const item = useContext(SC);
//         if (!item) throw new ServReactContextError("");
//         return item;
//       };
//       const borrowAndListen = () => {
//         const item = borrow();
//         ServReact.use(item);
//         return item;
//       };
//       return {
//         Provider: SC.Provider,
//         borrow,
//         borrowAndListen,
//       };
//     };
//   }

//   export const useObs = <T extends unknown>(obs: Obs<T>) => {
//     const [_, set] = useState(Symbol());
//     useEffect(() => {
//       const unsub = obs.sub(() => {
//         set(Symbol());
//       });
//       return () => {
//         unsub();
//       };
//     }, [obs]);
//   };

//   export const useOwned = <
//     API extends Serv.DefaultAPI,
//     Channels extends Serv.DefaultChannels,
//     Deps extends readonly any[],
//   >(
//     factoryFn: () => Serv<API, Channels>,
//     deps?: Deps,
//   ) => {
//     // eslint-disable-next-line react-hooks/exhaustive-deps

//     const memo = useMemo(() => {
//       let theServ = factoryFn();
//       let firstTime = true;
//       return {
//         change: () => {
//           if (firstTime) {
//             firstTime = false;
//           } else {
//             theServ = factoryFn();
//           }
//         },
//         get: () => theServ,
//       };
//     }, []);

//     const serv = memo.get();

//     useEffect(() => {
//       memo.change();
//     }, deps || []);

//     // destroy when parent is destroyed
//     useEffect(() => {
//       return () => {
//         serv.destroy();
//       };
//     }, [serv.id]);

//     // subscribe
//     use(serv);

//     return serv;
//   };

//   export const use = <
//     API extends Serv.DefaultAPI,
//     Channels extends Serv.DefaultChannels,
//     Deps extends readonly any[],
//   >(
//     serv: Serv<API, Channels>,
//     deps?: Deps,
//   ) => {
//     const [_, setKey] = useState<Symbol>(DEFAULT_SYMBOL);
//     useEffect(() => {
//       const unsub = serv.channels.change.sub(() => {
//         setKey(Symbol());
//       });

//       return () => {
//         unsub();
//       };
//     }, [serv.id, ...(deps || [])]);

//     return serv;
//   };
// }
