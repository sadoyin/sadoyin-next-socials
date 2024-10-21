import { validateRequest } from "@/auth"
import FollowButton from "@/components/FollowButton"
import Linkify from "@/components/Linkify"
import Post from "@/components/posts/Post"
import UserAvatar from "@/components/UserAvatar"
import UserTooltip from "@/components/UserTooltip"
import prisma from "@/lib/prisma"
import { getPostDataInclude, UserData } from "@/lib/types"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { title } from "process"
import { cache, Suspense } from "react"

interface PageProps{
    params:{postId:string}
}

const getPost= cache(async (postId:string, loggedInUserId:string)=>{
    const post = await prisma.post.findUnique({
        where:{
            id:postId
        },
        include: getPostDataInclude(loggedInUserId)
    })

    if(!post) notFound()
    
    return post
})

export async function generateMetadata({params:{postId}}:PageProps){
    const {user}=await validateRequest()

    if(!user) return {}

    const post = await getPost(postId,user.id)

    return {
        title: `${post.user.displayName}: ${post.content.slice(0,50)}...`
    }
}

export default async function Page({params:{postId}}:PageProps){
    const {user}=await validateRequest()

    if(!user){
        return (
            <p>
                You&apos;re not authorized to view this page
            </p>
        )
    }

    const post = await getPost(postId,user.id)

    return <main className="flex w-full min-w-0 gap-5">
        <div className="w-full min-w-0 space-y-5">
            <Post post={post}/>
        </div>
        <div className="sticky top-[5.25rem] hidden lg:block h-fit w-80 flex-none">
            <Suspense fallback={<Loader2 className="mx-auto animate-spin"/>}>
                <UserInfoSidebarProps user={post.user}/>
            </Suspense>
        </div>
    </main>


}

interface UserInfoSidebarProps{
    user:UserData
}

async function UserInfoSidebarProps({user}:UserInfoSidebarProps) {
    const {user:loggedInUser}=await validateRequest()

    if(!loggedInUser) return null

    return(
        <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
            <div className="text-xl font-bold">About this User</div>
            <UserTooltip user={user}>
                <Link href={`/users/${user.username}`} className="flex items-center gap-3">
                    <UserAvatar avatarUrl={user.avatarUrl} className="float-none"/>
                </Link>
                <div>
                    <p className="line-clamp-1 break-all font-semibold hover:underline">
                        {user.displayName}
                    </p>
                    <p className="line-clamp-1 break-all text-muted-foreground">
                        @{user.username}
                    </p>
                </div>
            </UserTooltip>
            <Linkify>
                <div className="line-clamp-6 whitespace-pre-line break-words text-muted-foreground">
                    {user.bio}
                </div>
            </Linkify>
            {user.id !== loggedInUser.id && (
                <FollowButton userId={user.id} initialState={{
                    followers: user._count.followers,
                    isFollowedByUser:user.followers.some(
                        ({followerId})=> followerId === loggedInUser.id,
                    )
                }}/>
            )}
        </div>
    )
}