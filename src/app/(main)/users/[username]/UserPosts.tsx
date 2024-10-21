"use client"

import InfiniteScrollContainer from "@/components/InfiniteScrollContainer"
import DeletePostDialog from "@/components/posts/DeletePostDialogue"
import Post from "@/components/posts/Post"
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton"
import { Button } from "@/components/ui/button"
import kyInstance from "@/lib/ky"
import { PostData, PostsPage } from "@/lib/types"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"

interface UserPostsProps{
    userId:string
}

export default function UserPosts({userId}:UserPostsProps){
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isFetchingNextPage,
        status
    } = useInfiniteQuery({
        queryKey: ["post-feed", "user-posts",userId],
        queryFn:({pageParam})=> kyInstance.get(
            `/api/users/${userId}/posts`,
            pageParam ? {searchParams: {cursor: pageParam}} : {}
        ).json<PostsPage>(),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage)=> lastPage.nextCursor
    })

    const posts = data?.pages.flatMap(page => page.posts) || []

    if(status === "pending"){
        return <PostsLoadingSkeleton/>
    }

    if(status === "success" && !posts.length && !hasNextPage){
        return <p className="text-center text-muted-foreground">
            This user has not post anything yet
        </p>
    }

    if(status ==="error"){
        return <p>
            An error occured while loading posts
        </p>
    }

    return <InfiniteScrollContainer onBottomReached={()=> hasNextPage && !isFetching && fetchNextPage()} className="space-y-5">
        {posts.map(post => (
            <Post key={post.id} post={post}/>
        ))}
        {isFetching &&  <Loader2 className="mx-auto my-3 animate-spin"/>}
    </InfiniteScrollContainer>
}