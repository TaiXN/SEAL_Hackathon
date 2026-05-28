using System;
using System.Collections.Generic;
using System.Text;

namespace APIViewModels.Team
{
    public class CreateTeamRequestModel
    {
        public string TeamName { get; set; }
        public string CategoryId { get; set; }
        public string Description { get; set; }
    }
}