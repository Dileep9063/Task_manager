function StatCard({title,value,icon,color}){


return(

<div className={`stat-card ${color}`}>


<div className="stat-icon">

{icon}

</div>


<div>

<h3>{title}</h3>

<h2>{value}</h2>

</div>


</div>

)


}


export default StatCard;