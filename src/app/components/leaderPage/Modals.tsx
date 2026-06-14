import { X, Camera, Mail, Phone, MapPin, Briefcase } from "lucide-react";

export function SettingsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-2xl rounded-radius-lg border border-border shadow-xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-border bg-muted/10">
          <div>
            <h2 className="text-xl font-bold text-foreground">Personal Information</h2>
            <p className="text-sm text-muted-foreground mt-1">Update your profile details and settings here.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-8">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border group">
              <span className="text-2xl sm:text-3xl font-bold text-primary">NL</span>
              <button className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-sm hover:scale-105 transition-transform">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h3 className="font-semibold text-base mb-1 text-foreground">Profile Picture</h3>
              <p className="text-sm text-muted-foreground mb-3">We support PNGs, JPEGs and GIFs under 10MB</p>
              <div className="flex gap-3">
                <button className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-radius-md font-medium hover:opacity-90 transition-opacity">Upload new</button>
                <button className="text-sm px-4 py-2 border border-border text-foreground rounded-radius-md font-medium hover:bg-muted transition-colors">Remove</button>
              </div>
            </div>
          </div>
          
          <hr className="border-border" />
          
          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">First Name</label>
              <input type="text" defaultValue="Quoc Lap" className="w-full p-3 bg-input-background border border-transparent rounded-radius-md text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Last Name</label>
              <input type="text" defaultValue="Nguyen" className="w-full p-3 bg-input-background border border-transparent rounded-radius-md text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" /> Email Address
              </label>
              <input type="email" defaultValue="lap.nguyen@hackathon.com" className="w-full p-3 bg-input-background border border-transparent rounded-radius-md text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" /> Phone Number
              </label>
              <input type="tel" defaultValue="+84 987 654 321" className="w-full p-3 bg-input-background border border-transparent rounded-radius-md text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" /> Role
              </label>
              <input type="text" defaultValue="Team Leader" className="w-full p-3 bg-input-background border border-transparent rounded-radius-md text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" /> Location
              </label>
              <input type="text" defaultValue="Ho Chi Minh City, VN" className="w-full p-3 bg-input-background border border-transparent rounded-radius-md text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
            </div>
            
            <div className="col-span-1 sm:col-span-2 space-y-2">
              <label className="text-sm font-semibold text-foreground">Bio</label>
              <textarea rows={3} defaultValue="Frontend developer with a passion for building clean, elegant, and user-friendly web interfaces." className="w-full p-3 bg-input-background border border-transparent rounded-radius-md text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none" />
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-border flex justify-end gap-3 bg-muted/10">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-foreground hover:bg-muted rounded-radius-md transition-colors border border-transparent hover:border-border">Cancel</button>
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold bg-primary text-primary-foreground rounded-radius-md shadow-sm transition-opacity hover:opacity-90">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

export function PortfolioModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-sm rounded-radius-lg border border-border shadow-2xl flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-background/30 hover:bg-background/80 backdrop-blur-md rounded-full transition-colors z-10 text-foreground">
          <X className="w-4 h-4" />
        </button>
        
        <div className="h-32 bg-primary/20 w-full relative">
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 p-2 bg-card rounded-full">
            <div className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold shadow-md border-4 border-card relative">
              NL
              <div className="absolute bottom-1 right-1 w-4 h-4 bg-chart-2 rounded-full border-2 border-card"></div>
            </div>
          </div>
        </div>
        
        <div className="pt-16 pb-8 px-8 text-center bg-gradient-to-b from-transparent to-muted/10">
          <h2 className="text-2xl font-bold mb-1 text-foreground">Nguyen Quoc Lap</h2>
          <div className="inline-block bg-primary/10 text-primary font-bold text-[10px] tracking-widest uppercase px-3 py-1 rounded-full mb-5">
            Team Leader
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed mx-auto border-t border-border/50 pt-5">
            Frontend developer with a passion for building clean, elegant, and user-friendly web interfaces. Let's create something amazing!
          </p>
        </div>
      </div>
    </div>
  );
}
