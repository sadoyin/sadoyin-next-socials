import { LikeInfo } from "@/lib/types";
import { useToast } from "../ui/use-toast";
import { QueryKey, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import { date } from "zod";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LikeButtonProps{
    postId: string,
    initialState:LikeInfo
}

export default function LikeButton({postId,initialState}:LikeButtonProps){
    const {toast} = useToast()

    const queryClient = useQueryClient()

    const queryKey:QueryKey=["like-info",postId]

    const {data} = useQuery({
        queryKey,
        queryFn: ()=> kyInstance.get(`/api/posts/${postId}/likes`).json<LikeInfo>(),
        initialData:initialState,
        staleTime:Infinity,
    })

    const {mutate} = useMutation({
        mutationFn: ()=>
            data.isLikeByUser
        ? kyInstance.delete(`/api/posts/${postId}/likes`)
        : kyInstance.post(`/api/posts/${postId}/likes`),
        onMutate: async ()=>{
            
            await queryClient.cancelQueries({queryKey})

            const previousState = queryClient.getQueryData<LikeInfo>(queryKey)

            queryClient.setQueryData<LikeInfo>(queryKey, ()=> ({
                likes: (previousState?.likes || 0) + (previousState?.isLikeByUser ? -1 : 1),
                isLikeByUser: !previousState?.isLikeByUser
            }))

            return {previousState}
        },
        onError(error, variables, context){
            queryClient.setQueryData(queryKey,context?.previousState),
            console.error(error)
            toast({
                variant:"destructive",
                description:"Somethng went wrong"
            })
        }
    })

    return <button onClick={()=> mutate()} className="flex items-center gap-2">
        <Heart className={cn("size-5", data.isLikeByUser && "fill-red-500 text-red-500")}/>
        <span className="text-sm font-medium tabular-nums">
            {data.likes} <span className="hidden sm:inline">likes</span>
        </span>
    </button>
}