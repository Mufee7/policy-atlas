declare module 'mammoth/mammoth.browser' {
 export function extractRawText(input:{arrayBuffer:ArrayBufferLike}):Promise<{value:string;messages:{type:string;message:string}[]}>;
 const mammoth:{extractRawText:typeof extractRawText};export default mammoth;
}
