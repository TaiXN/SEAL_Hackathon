using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace APIViewModels.Event
{
    public class CreateEventAPIViewModel
    {
        [Required]
        public string EventName { get; set; }
        [Required]
        public string Season { get; set; }
        [Required]
        public int Year { get; set; }
       

    }
}
