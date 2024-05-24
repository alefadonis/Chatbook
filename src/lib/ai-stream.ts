import { error } from 'console'
import {createParser, ParsedEvent, ReconnectInterval} from 'eventsource-parser'

export type AIAgent = "system" | "user" | "assistant"

export interface AIMessage {
    role: AIAgent 
    content: string
}

export interface AIBotStreamPayload {
        model: string,
        messages: AIMessage[],
        temperature: number,
        top_p: number,
        frequency_penalty: number,
        presence_penalty: number,
        max_tokens: number,
        stream: boolean,
        n: number
}


export async function AIBotStream(payload: AIBotStreamPayload) {
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    let counter = 0 

    const res = await fetch('https://80b9-34-16-217-27.ngrok-free.app/chat/', { //TODO Adicionar depois a URL
        method: 'POST',
        headers: {
            'Content-Type': "application/json",
            Authorization: `Bearer ${process.env.AIBOT_KEY}`
        },
        body: JSON.stringify(payload),
    }
    ) 

    const stream = new ReadableStream({
        async start(controller){
            function onParse(event: ParsedEvent | ReconnectInterval){
                if(event.type === 'event'){
                    const data = event.data
                    if(data === '[DONE]'){
                        controller.close()
                        return
                    }
                    try{
                        const json = JSON.parse(data)
                        const text = json.choices[0].delta?.content || ''

                        if(counter < 2 && (text.match(/\n/) || []).length){
                            return
                        }

                        const queue = encoder.encode(text)
                        controller.enqueue(queue)

                        counter++

                    } catch(error){
                    console.log(error)
                    }
                }
            }

            const parser = createParser(onParse)

            for await (const chunk of res.body as any){
                parser.feed(decoder.decode(chunk))
            }
        }
    })

    return stream
}