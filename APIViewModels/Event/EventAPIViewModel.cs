using System;
using System.Collections.Generic;
using System.Text;

namespace APIViewModels.Event
{
    public class EventAPIViewModel
    {
        public string EventId { get; set; }
        public string Creator { get; set; }
        public string EventName { get; set; }
        public string Season { get; set; }
        public int Year { get; set; }
        public bool IsActive { get; set; }
        public int CurrentRound { get; set; }
    }
}
