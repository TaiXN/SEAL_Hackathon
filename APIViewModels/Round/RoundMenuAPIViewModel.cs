using System;
using System.Collections.Generic;
using System.Text;

namespace APIViewModels.Round
{
    public class RoundMenuAPIViewModel
    {
        public string RoundId { get; set; }
        public string RoundName { get; set; }

        public List<TrackMenuAPIViewModel> Tracks { get; set; }
    }

    public class TrackMenuAPIViewModel
    {
        public string TrackId { get; set; }
        public string TrackName { get; set; }
    }
}
