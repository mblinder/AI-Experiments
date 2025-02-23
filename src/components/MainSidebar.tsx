
import {
  Sidebar,
  SidebarContent,
  SidebarTrigger,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Newspaper, Video, Headphones, Settings } from "lucide-react"

interface MainSidebarProps {
  onMenuClick: (type: 'all' | 'article' | 'video' | 'podcast') => void;
  activeType: 'all' | 'article' | 'video' | 'podcast';
}

export function MainSidebar({ onMenuClick, activeType }: MainSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <h2 className="text-lg font-semibold">Menu</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => onMenuClick('article')}
              isActive={activeType === 'article'}
            >
              <Newspaper className="h-4 w-4" />
              <span>Articles</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => onMenuClick('video')}
              isActive={activeType === 'video'}
            >
              <Video className="h-4 w-4" />
              <span>Videos</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => onMenuClick('podcast')}
              isActive={activeType === 'podcast'}
            >
              <Headphones className="h-4 w-4" />
              <span>Podcasts</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
