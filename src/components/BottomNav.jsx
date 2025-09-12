import progressIcon from "../assets/icons/progress.svg";
import timerIcon    from "../assets/icons/timer.svg";
import journalIcon  from "../assets/icons/journal.svg";

export default function BottomNav({ current, onChange }){
  const tabs = [
    { id:"progress", title:"Progresso", icon:progressIcon },
    { id:"timer",    title:"Timer",     icon:timerIcon },
    { id:"journal",  title:"Diário",    icon:journalIcon },
  ];
  return (
    <nav className="bottom-nav" role="tablist">
      {tabs.map(({id,title,icon})=>{
        const active = current===id;
        return (
          <button key={id} className="nav-btn" role="tab"
                  aria-selected={active?"true":"false"} title={title}
                  onClick={()=>onChange(id)}>
            <img className="nav-icon" src={icon} alt="" aria-hidden="true" />
          </button>
        );
      })}
    </nav>
  );
}
