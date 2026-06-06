using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace APIViewModels.Event
{
    public class UpdateEventAPIViewModel
    {
        [Required]
        public string EventName { get; set; }
        [Required]
        public string Season { get; set; }
        [Required]
        public int Year { get; set; }
        [Required]
        public int CurrentRound { get; set; }
    }
}
