using APIViewModels.Evaluation;
using DataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.EvaluationService;

namespace SEAL_Hackathon.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EvaluationController : ControllerBase
    {
        private readonly IEvaluationService _evaluation;

        public EvaluationController(IEvaluationService evaluations)
        {
            _evaluation = evaluations;
        }

        

    }
}
