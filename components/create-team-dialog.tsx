// "use client";

// import { useState, useEffect } from "react";
// import { useForm } from "react-hook-form";
// import {
//   Sheet,
//   SheetContent,
//   SheetDescription,
//   SheetHeader,
//   SheetTitle,
// } from "@/components/ui/sheet";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Badge } from "@/components/ui/badge";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Loader2, Users } from "lucide-react";
// import { toast } from "sonner";

// interface StaffMember {
//   id: string;
//   role: string;
//   jobTitle: string | null;
//   user: {
//     id: string;
//     name: string | null;
//     email: string;
//     image: string | null;
//   } | null;
// }

// interface CreateTeamDialogProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   companyId: string;
//   onSuccess: () => void;
// }

// interface TeamFormData {
//   name: string;
//   description: string;
// }

// export function CreateTeamDialog({
//   open,
//   onOpenChange,
//   companyId,
//   onSuccess,
// }: CreateTeamDialogProps) {
//   const [step, setStep] = useState(1);
//   const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
//   const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
//   const [managerIds, setManagerIds] = useState<string[]>([]);
//   const [teamLeadIds, setTeamLeadIds] = useState<string[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [staffLoading, setStaffLoading] = useState(false);

//   const {
//     register,
//     handleSubmit,
//     reset,
//     formState: { errors },
//   } = useForm<TeamFormData>({
//     defaultValues: {
//       name: "",
//       description: "",
//     },
//   });

//   // Fetch staff members when dialog opens
//   useEffect(() => {
//     const fetchStaffMembers = async () => {
//       if (!companyId) {
//         setStaffMembers([]);
//         return;
//       }

//       setStaffLoading(true);
//       try {
//         const response = await fetch(
//           `/api/workforce/staff?companyId=${companyId}`
//         );
//         const data = await response.json();

//         if (response.ok && data.staff) {
//           setStaffMembers(data.staff);
//         } else {
//           toast.error("Failed to load staff members");
//         }
//       } catch (error) {
//         console.error("Error fetching staff:", error);
//         toast.error("Failed to load staff members");
//       } finally {
//         setStaffLoading(false);
//       }
//     };

//     if (open && companyId) {
//       fetchStaffMembers();
//     } else if (open && !companyId) {
//       // Dialog opened but no company selected
//       setStaffMembers([]);
//     }
//   }, [open, companyId]);

//   const toggleMember = (staffId: string) => {
//     setSelectedMembers((prev) =>
//       prev.includes(staffId)
//         ? prev.filter((id) => id !== staffId)
//         : [...prev, staffId]
//     );
//   };

//   const onSubmit = async (data: TeamFormData) => {

//     // Require at least one team member (manager, lead, or staff)
//     const totalMembersCount =
//       selectedMembers.length + managerIds.length + teamLeadIds.length;

//     if (totalMembersCount === 0) {
//       toast.error(
//         "Please add at least one team member (manager, lead, or staff) before creating a team."
//       );
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await fetch("/api/teams", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           name: data.name,
//           description: data.description || null,
//           companyId,
//           memberIds: selectedMembers,
//           managerIds,
//           teamLeadIds,
//         }),
//       });

//       const result = await response.json();

//       if (!response.ok) {
//         throw new Error(result.error || "Failed to create team");
//       }

//       toast.success("Team created successfully!");
//       reset();
//       setSelectedMembers([]);
//       setManagerIds([]);
//       setTeamLeadIds([]);
//       onSuccess();
//       onOpenChange(false);
//     } catch (error) {
//       console.error("Error creating team:", error);
//       toast.error(
//         error instanceof Error ? error.message : "Failed to create team"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Clean up state when dialog closes
//   useEffect(() => {
//     if (!open) {
//       setStep(1);
//       reset();
//       setSelectedMembers([]);
//       setManagerIds([]);
//       setTeamLeadIds([]);
//     }
//   }, [open, reset]);

//   const getRoleColor = (role: string) => {
//     switch (role) {
//       case "ADMIN":
//         return "bg-purple-500/10 text-purple-700 border-purple-200";
//       case "MANAGER":
//         return "bg-blue-500/10 text-blue-700 border-blue-200";
//       case "STAFF":
//         return "bg-green-500/10 text-green-700 border-green-200";
//       case "CONTRACTOR":
//         return "bg-orange-500/10 text-orange-700 border-orange-200";
//       default:
//         return "bg-gray-500/10 text-gray-700 border-gray-200";
//     }
//   };

//   return (
//     <Sheet open={open} onOpenChange={onOpenChange}>
//       <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
//         <SheetHeader>
//           <SheetTitle>Create New Team</SheetTitle>
//           <SheetDescription>
//             Step {step} of 4: {step === 1 && "Team Details"}
//             {step === 2 && "Select Managers"}
//             {step === 3 && "Select Team Leads"}
//             {step === 4 && "Select Team Staff"}
//           </SheetDescription>
//         </SheetHeader>

//         {/* Progress Indicator */}
//         <div className="flex items-center justify-between px-6 mt-6 mb-4">
//           {[1, 2, 3, 4].map((s) => (
//             <div key={s} className="flex items-center flex-1">
//               <div
//                 className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
//                   s === step
//                     ? "bg-primary text-primary-foreground"
//                     : s < step
//                     ? "bg-primary/20 text-primary"
//                     : "bg-muted text-muted-foreground"
//                 }`}
//               >
//                 {s}
//               </div>
//               {s < 4 && (
//                 <div
//                   className={`flex-1 h-1 mx-2 ${
//                     s < step ? "bg-primary" : "bg-muted"
//                   }`}
//                 />
//               )}
//             </div>
//           ))}
//         </div>

//         <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6 px-6">
//           {/* Step 1: Team Details */}
//           {step === 1 && (
//             <>
//               {/* Team Name */}
//               <div className="space-y-2">
//                 <Label htmlFor="name">
//                   Team Name <span className="text-destructive">*</span>
//                 </Label>
//                 <Input
//                   id="name"
//                   {...register("name", {
//                     required: "Team name is required",
//                     minLength: {
//                       value: 2,
//                       message: "Team name must be at least 2 characters",
//                     },
//                   })}
//                   placeholder="e.g., Engineering, Marketing, Sales"
//                   disabled={loading}
//                 />
//                 {errors.name && (
//                   <p className="text-sm text-destructive">
//                     {errors.name.message}
//                   </p>
//                 )}
//               </div>

//               {/* Description */}
//               <div className="space-y-2">
//                 <Label htmlFor="description">Description</Label>
//                 <Textarea
//                   id="description"
//                   {...register("description")}
//                   placeholder="Brief description of the team's purpose..."
//                   rows={3}
//                   disabled={loading}
//                 />
//               </div>
//             </>
//           )}

//           {/* Step 2: Team Managers Selection */}
//           {step === 2 && (
//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <Label>Team Managers (Optional)</Label>
//                 <span className="text-sm text-muted-foreground">
//                   {managerIds.length} selected
//                 </span>
//               </div>
//               <div className="rounded-md border">
//                 <ScrollArea className="h-[150px]">
//                   {staffLoading ? (
//                     <div className="flex items-center justify-center h-full">
//                       <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
//                     </div>
//                   ) : staffMembers.length === 0 ? (
//                     <div className="flex flex-col items-center justify-center h-full p-4 text-center">
//                       <Users className="h-8 w-8 text-muted-foreground mb-2" />
//                       <span className="text-sm text-muted-foreground">
//                         No staff members available
//                       </span>
//                     </div>
//                   ) : (
//                     <div className="p-4 space-y-3">
//                       {staffMembers.map((staff) => {
//                         const user = staff.user;
//                         if (!user) {
//                           return null;
//                         }

//                         const displayName = user.name || user.email || "User";
//                         const initial =
//                           user.name?.charAt(0) ||
//                           user.email?.charAt(0)?.toUpperCase() ||
//                           "?";

//                         return (
//                           <div
//                             key={staff.id}
//                             className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent transition-colors"
//                           >
//                             <Checkbox
//                               id={`manager-${staff.id}`}
//                               checked={managerIds.includes(staff.id)}
//                               onCheckedChange={(checked) => {
//                                 if (checked) {
//                                   setManagerIds((prev) => [...prev, staff.id]);
//                                   setSelectedMembers((prev) =>
//                                     prev.includes(staff.id)
//                                       ? prev
//                                       : [...prev, staff.id]
//                                   );
//                                 } else {
//                                   setManagerIds((prev) =>
//                                     prev.filter((id) => id !== staff.id)
//                                   );
//                                 }
//                               }}
//                               disabled={loading}
//                             />
//                             <label
//                               htmlFor={`manager-${staff.id}`}
//                               className="flex items-center gap-3 flex-1 cursor-pointer"
//                             >
//                               <Avatar className="h-8 w-8">
//                                 <AvatarImage
//                                   src={user.image || undefined}
//                                   alt={displayName}
//                                 />
//                                 <AvatarFallback>{initial}</AvatarFallback>
//                               </Avatar>
//                               <div className="flex-1">
//                                 <p className="text-sm font-medium">
//                                   {displayName}
//                                 </p>
//                                 <p className="text-xs text-muted-foreground">
//                                   {staff.jobTitle || staff.role}
//                                 </p>
//                               </div>
//                               <Badge variant="secondary" className="text-xs">
//                                 {staff.role}
//                               </Badge>
//                             </label>
//                           </div>
//                         );
//                       })}
//                     </div>
//                   )}
//                 </ScrollArea>
//               </div>
//             </div>
//           )}

//           {/* Step 3: Team Leads Selection */}
//           {step === 3 && (
//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <Label>Team Leads (Optional)</Label>
//                 <span className="text-sm text-muted-foreground">
//                   {teamLeadIds.length} selected
//                 </span>
//               </div>
//               <div className="rounded-md border">
//                 <ScrollArea className="h-[150px]">
//                   {staffLoading ? (
//                     <div className="flex items-center justify-center h-full">
//                       <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
//                     </div>
//                   ) : staffMembers.length === 0 ? (
//                     <div className="flex flex-col items-center justify-center h-full p-4 text-center">
//                       <Users className="h-8 w-8 text-muted-foreground mb-2" />
//                       <span className="text-sm text-muted-foreground">
//                         No staff members available
//                       </span>
//                     </div>
//                   ) : (
//                     <div className="p-4 space-y-3">
//                       {staffMembers.map((staff) => {
//                         const user = staff.user;
//                         if (!user) {
//                           return null;
//                         }

//                         const displayName = user.name || user.email || "User";
//                         const initial =
//                           user.name?.charAt(0) ||
//                           user.email?.charAt(0)?.toUpperCase() ||
//                           "?";

//                         return (
//                           <div
//                             key={staff.id}
//                             className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent transition-colors"
//                           >
//                             <Checkbox
//                               id={`lead-${staff.id}`}
//                               checked={teamLeadIds.includes(staff.id)}
//                               onCheckedChange={(checked) => {
//                                 if (checked) {
//                                   setTeamLeadIds((prev) => [...prev, staff.id]);
//                                   setSelectedMembers((prev) =>
//                                     prev.includes(staff.id)
//                                       ? prev
//                                       : [...prev, staff.id]
//                                   );
//                                 } else {
//                                   setTeamLeadIds((prev) =>
//                                     prev.filter((id) => id !== staff.id)
//                                   );
//                                 }
//                               }}
//                               disabled={loading}
//                             />
//                             <label
//                               htmlFor={`lead-${staff.id}`}
//                               className="flex items-center gap-3 flex-1 cursor-pointer"
//                             >
//                               <Avatar className="h-8 w-8">
//                                 <AvatarImage
//                                   src={user.image || undefined}
//                                   alt={displayName}
//                                 />
//                                 <AvatarFallback>{initial}</AvatarFallback>
//                               </Avatar>
//                               <div className="flex-1">
//                                 <p className="text-sm font-medium">
//                                   {displayName}
//                                 </p>
//                                 <p className="text-xs text-muted-foreground">
//                                   {staff.jobTitle || staff.role}
//                                 </p>
//                               </div>
//                               <Badge variant="secondary" className="text-xs">
//                                 {staff.role}
//                               </Badge>
//                             </label>
//                           </div>
//                         );
//                       })}
//                     </div>
//                   )}
//                 </ScrollArea>
//               </div>
//             </div>
//           )}

//           {/* Step 4: Team Staff Selection */}
//           {step === 4 && (
//             <div className="space-y-3">
//               <div className="flex items-center justify-between">
//                 <Label>Team Staff (Optional)</Label>
//                 <span className="text-sm text-muted-foreground">
//                   {selectedMembers.length} selected
//                 </span>
//               </div>

//               {staffLoading ? (
//                 <div className="flex items-center justify-center py-8">
//                   <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
//                 </div>
//               ) : staffMembers.length === 0 ? (
//                 <div className="text-center py-8 border-2 border-dashed rounded-lg">
//                   <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
//                   <p className="text-sm text-muted-foreground">
//                     No staff members available
//                   </p>
//                 </div>
//               ) : (
//                 <ScrollArea className="h-[300px] border rounded-lg">
//                   <div className="p-4 space-y-2">
//                     {staffMembers.map((member) => {
//                       const user = member.user;
//                       if (!user) {
//                         return null;
//                       }

//                       const displayName = user.name || user.email || "User";
//                       const initial =
//                         user.name?.[0] ||
//                         user.email?.[0]?.toUpperCase() ||
//                         "?";

//                       return (
//                         <div
//                           key={member.id}
//                           className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
//                           onClick={() => toggleMember(member.id)}
//                         >
//                           <Checkbox
//                             checked={selectedMembers.includes(member.id)}
//                             onCheckedChange={() => toggleMember(member.id)}
//                             disabled={loading}
//                           />
//                           <Avatar className="h-10 w-10">
//                             <AvatarImage
//                               src={user.image || undefined}
//                               alt={displayName}
//                             />
//                             <AvatarFallback>{initial}</AvatarFallback>
//                           </Avatar>
//                           <div className="flex-1 min-w-0">
//                             <p className="font-medium truncate">
//                               {displayName}
//                             </p>
//                             {member.jobTitle && (
//                               <p className="text-sm text-muted-foreground truncate">
//                                 {member.jobTitle}
//                               </p>
//                             )}
//                           </div>
//                           <Badge
//                             variant="outline"
//                             className={`${getRoleColor(member.role)}`}
//                           >
//                             {member.role}
//                           </Badge>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 </ScrollArea>
//               )}
//             </div>
//           )}

//           {/* Navigation Buttons */}
//           <div className="flex justify-between gap-2 pt-4 border-t mt-6">
//             <div className="flex gap-2">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => onOpenChange(false)}
//                 disabled={loading}
//               >
//                 Cancel
//               </Button>
//               {step > 1 && (
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={() => setStep(step - 1)}
//                   disabled={loading}
//                 >
//                   Back
//                 </Button>
//               )}
//             </div>
//             <div>
//               {step < 4 ? (
//                 <Button
//                   type="button"
//                   onClick={() => {
//                     if (step === 1) {
//                       // Validate step 1 - team name required
//                       const name = (
//                         document.querySelector(
//                           '[name="name"]'
//                         ) as HTMLInputElement
//                       )?.value;
//                       if (!name?.trim()) {
//                         return;
//                       }
//                     }
//                     setStep(step + 1);
//                   }}
//                   disabled={loading}
//                 >
//                   Next
//                 </Button>
//               ) : (
//                 <Button type="submit" disabled={loading}>
//                   {loading ? (
//                     <>
//                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                       Creating...
//                     </>
//                   ) : (
//                     "Create Team"
//                   )}
//                 </Button>
//               )}
//             </div>
//           </div>
//         </form>
//       </SheetContent>
//     </Sheet>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface StaffMember {
  id: string;
  role: string;
  jobTitle: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
}

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onSuccess: () => void;
}

interface TeamFormData {
  name: string;
  description: string;
}

export function CreateTeamDialog({
  open,
  onOpenChange,
  companyId,
  onSuccess,
}: CreateTeamDialogProps) {
  const [step, setStep] = useState(1);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [managerIds, setManagerIds] = useState<string[]>([]);
  const [teamLeadIds, setTeamLeadIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<TeamFormData>({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const watchName = watch("name");
  const watchDescription = watch("description");

  // Fetch staff on dialog open
  useEffect(() => {
    const fetchStaffMembers = async () => {
      if (!companyId) {
        setStaffMembers([]);
        return;
      }

      setStaffLoading(true);
      try {
        const response = await fetch(
          `/api/workforce/staff?companyId=${companyId}`
        );
        const data = await response.json();

        if (response.ok && data.staff) {
          setStaffMembers(data.staff);
        } else {
          toast.error("Failed to load staff members");
        }
      } catch (error) {
        console.error("Error fetching staff:", error);
        toast.error("Failed to load staff members");
      } finally {
        setStaffLoading(false);
      }
    };

    if (open && companyId) fetchStaffMembers();
    else if (open && !companyId) setStaffMembers([]);
  }, [open, companyId]);

  const toggleMember = (staffId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId]
    );
  };

  // Submit only on Step 5
  const onSubmit = async (data: TeamFormData) => {
    const totalMembersCount =
      selectedMembers.length + managerIds.length + teamLeadIds.length;

    if (totalMembersCount === 0) {
      toast.error("Please add at least one team member.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          companyId,
          memberIds: selectedMembers,
          managerIds,
          teamLeadIds,
        }),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to create team");

      toast.success("Team created successfully!");
      reset();
      setSelectedMembers([]);
      setManagerIds([]);
      setTeamLeadIds([]);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create team"
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset on sheet close
  useEffect(() => {
    if (!open) {
      setStep(1);
      reset();
      setSelectedMembers([]);
      setManagerIds([]);
      setTeamLeadIds([]);
    }
  }, [open, reset]);

  const getMemberName = (id: string) => {
    const m = staffMembers.find((s) => s.id === id);
    return m?.user?.name || m?.user?.email || "Unknown";
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-500/10 text-purple-700 border-purple-200";
      case "MANAGER":
        return "bg-blue-500/10 text-blue-700 border-blue-200";
      case "STAFF":
        return "bg-green-500/10 text-green-700 border-green-200";
      case "CONTRACTOR":
        return "bg-orange-500/10 text-orange-700 border-orange-200";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create New Team</SheetTitle>
          <SheetDescription>Step {step} of 5</SheetDescription>
        </SheetHeader>

        {/* Progress */}
        <div className="flex items-center justify-between px-6 mt-6 mb-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s === step
                    ? "bg-primary text-primary-foreground"
                    : s < step
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </div>
              {s < 5 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    s < step ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="space-y-6 mt-6 px-6">
          {/* STEP 1: DETAILS */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>Team Name *</Label>
                <Input
                  {...register("name", {
                    required: "Team name is required",
                    minLength: { value: 2, message: "Too short" },
                  })}
                  placeholder="Engineering, Marketing..."
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  {...register("description")}
                  placeholder="Optional description..."
                  rows={3}
                />
              </div>
            </>
          )}

          {/* STEP 2: MANAGERS */}
          {step === 2 && (
            <div className="space-y-2">
              <Label>Team Managers (Optional)</Label>
              <ScrollArea className="h-[150px] border rounded-md">
                {staffLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="animate-spin h-6 w-6" />
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {staffMembers.map((m) => {
                      const user = m.user;
                      if (!user) return null;

                      return (
                        <div
                          key={m.id}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-accent"
                        >
                          <Checkbox
                            checked={managerIds.includes(m.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setManagerIds((p) => [...p, m.id]);
                                setSelectedMembers((p) =>
                                  p.includes(m.id) ? p : [...p, m.id]
                                );
                              } else {
                                setManagerIds((p) =>
                                  p.filter((id) => id !== m.id)
                                );
                              }
                            }}
                          />
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={user.image || undefined}
                              alt={user.name || user.email || "User"}
                            />
                            <AvatarFallback>
                              {user.name?.[0] || user.email?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {user.name || user.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {m.jobTitle}
                            </p>
                          </div>
                          <Badge>{m.role}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* STEP 3: LEADS */}
          {step === 3 && (
            <div className="space-y-2">
              <Label>Team Leads (Optional)</Label>
              <ScrollArea className="h-[150px] border rounded-md">
                <div className="p-3 space-y-2">
                  {staffMembers.map((m) => {
                    const user = m.user;
                    if (!user) return null;

                    return (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-accent"
                      >
                        <Checkbox
                          checked={teamLeadIds.includes(m.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setTeamLeadIds((p) => [...p, m.id]);
                              setSelectedMembers((p) =>
                                p.includes(m.id) ? p : [...p, m.id]
                              );
                            } else {
                              setTeamLeadIds((p) =>
                                p.filter((id) => id !== m.id)
                              );
                            }
                          }}
                        />

                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={user.image || undefined}
                            alt={user.name || user.email || "User"}
                          />
                          <AvatarFallback>
                            {user.name?.[0] || user.email?.[0]}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {user.name || user.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {m.jobTitle}
                          </p>
                        </div>

                        <Badge>{m.role}</Badge>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* STEP 4: STAFF (With FIXED CHECKBOX) */}
          {step === 4 && (
            <div className="space-y-2">
              <Label>Team Staff (Optional)</Label>

              <ScrollArea className="h-[220px] border rounded-md">
                <div className="p-3 space-y-2">
                  {staffMembers.map((m) => {
                    const user = m.user;
                    if (!user) return null;

                    return (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                        onClick={() => toggleMember(m.id)}
                      >
                        <Checkbox
                          checked={selectedMembers.includes(m.id)}
                          onCheckedChange={() => toggleMember(m.id)}
                          onClick={(e) => e.stopPropagation()} // ← FIXED HERE
                        />

                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={user.image || undefined}
                            alt={user.name || user.email || "User"}
                          />
                          <AvatarFallback>
                            {user.name?.[0] || user.email?.[0]}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {user.name || user.email}
                          </p>
                          {m.jobTitle && (
                            <p className="text-sm text-muted-foreground truncate">
                              {m.jobTitle}
                            </p>
                          )}
                        </div>

                        <Badge
                          variant="outline"
                          className={getRoleColor(m.role)}
                        >
                          {m.role}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* STEP 5: CONFIRMATION */}
          {step === 5 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Confirm Team Details</h3>

              <p>
                <strong>Team Name:</strong> {watchName}
              </p>
              <p>
                <strong>Description:</strong> {watchDescription || "N/A"}
              </p>

              <div>
                <strong>Managers:</strong>
                <ul className="list-disc ml-6">
                  {managerIds.length === 0 && <li>None</li>}
                  {managerIds.map((id) => (
                    <li key={id}>{getMemberName(id)}</li>
                  ))}
                </ul>
              </div>

              <div>
                <strong>Team Leads:</strong>
                <ul className="list-disc ml-6">
                  {teamLeadIds.length === 0 && <li>None</li>}
                  {teamLeadIds.map((id) => (
                    <li key={id}>{getMemberName(id)}</li>
                  ))}
                </ul>
              </div>

              <div>
                <strong>Staff Members:</strong>
                <ul className="list-disc ml-6">
                  {selectedMembers.length === 0 && <li>None</li>}
                  {selectedMembers.map((id) => (
                    <li key={id}>{getMemberName(id)}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between gap-2 pt-4 border-t mt-6">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>

              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </Button>
              )}
            </div>

            <div>
              {step < 5 ? (
                <Button
                  type="button"
                  onClick={() => {
                    if (step === 1 && !watchName.trim()) return;
                    setStep(step + 1);
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Confirm & Create Team"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
