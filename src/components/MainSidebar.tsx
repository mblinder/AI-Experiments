
import {
  Sidebar,
  SidebarContent,
  SidebarTrigger,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar
} from "@/components/ui/sidebar"
import { Newspaper, Video, Settings } from "lucide-react"

interface MainSidebarProps {
  onMenuClick: (type: 'all' | 'article' | 'video' | 'podcast') => void;
  activeType: 'all' | 'article' | 'video' | 'podcast';
}

export function MainSidebar({ onMenuClick, activeType }: MainSidebarProps) {
  const { isMobile, setOpen, setOpenMobile } = useSidebar();

  const handleMenuItemClick = (type: 'all' | 'article' | 'video' | 'podcast') => {
    onMenuClick(type);
    // Close the appropriate menu based on device type
    if (isMobile) {
      setOpenMobile(false);
    } else {
      setOpen(false);
    }
  };

  return (
    <Sidebar side="right">
      <SidebarHeader className="p-4">
        <h2 className="text-lg font-semibold">Menu</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => handleMenuItemClick('article')}
              isActive={activeType === 'article'}
            >
              <Newspaper className="h-4 w-4" />
              <span>Articles</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => handleMenuItemClick('video')}
              isActive={activeType === 'video' || activeType === 'podcast'}
            >
              <Video className="h-4 w-4" />
              <span>Videos & Pods</span>
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
