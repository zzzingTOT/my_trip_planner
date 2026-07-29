"""旅行规划API路由"""

import asyncio
from fastapi import APIRouter, HTTPException
from ...models.schemas import (
    TripRequest,
    TripPlanResponse,
    GuideExtractionResponse,
    GuideConfirmRequest,
    GuideExtractionRequest,
    ErrorResponse
)
from ...agents.trip_planner_agent import get_trip_planner_agent, plan_trip_from_skeleton
from ...services.guide_parser_service import get_guide_parser

router = APIRouter(prefix="/trip", tags=["旅行规划"])


@router.post(
    "/plan",
    response_model=TripPlanResponse,
    summary="生成旅行计划",
    description="根据用户输入的旅行需求,生成详细的旅行计划"
)
async def plan_trip(request: TripRequest):
    """
    生成旅行计划

    Args:
        request: 旅行请求参数

    Returns:
        旅行计划响应
    """
    try:
        print(f"\n{'='*60}")
        print(f"📥 收到旅行规划请求:")
        print(f"   出发地: {request.departure_city}")
        print(f"   目的地: {', '.join(request.cities)}")  
        print(f"   日期: {request.start_date} - {request.end_date}")
        print(f"   天数: {request.travel_days}")
        print(f"{'='*60}\n")

        # 获取Agent实例
        print("🔄 获取多智能体系统实例...")
        agent = get_trip_planner_agent()

        # 生成旅行计划（在后台线程中执行，避免阻塞事件循环）
        print("🚀 开始生成旅行计划...")
        trip_plan = await asyncio.to_thread(agent.plan_trip, request)

        print("✅ 旅行计划生成成功,准备返回响应\n")

        return TripPlanResponse(
            success=True,
            message="旅行计划生成成功",
            data=trip_plan
        )

    except Exception as e:
        print(f"❌ 生成旅行计划失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"生成旅行计划失败: {str(e)}"
        )


@router.post(
    "/extract-guide",
    response_model=GuideExtractionResponse,
    summary="提取攻略骨架",
    description="从用户粘贴的旅行攻略文本中提取结构化行程骨架。支持多篇攻略同时解析和融合。"
)
async def extract_guide(request: GuideExtractionRequest):
    """
    攻略文本 → 结构化行程骨架（两段式流程的第一步：提取+预览）

    Args:
        request: 包含攻略文本列表和辅助信息

    Returns:
        提取的行程骨架，供前端展示和用户勾选确认
    """
    try:
        print(f"\n{'='*60}")
        print(f"📥 收到攻略提取请求:")
        print(f"   攻略篇数: {len(request.guide_texts)}")
        print(f"   总字符数: {sum(len(t) for t in request.guide_texts)}")
        print(f"   目的地: {request.cities if request.cities else '未指定'}")
        print(f"{'='*60}\n")

        parser = get_guide_parser()
        result = await asyncio.to_thread(parser.extract, request)

        print(f"✅ 攻略提取完成:")
        print(f"   识别天数: {result.total_days}")
        print(f"   景点数: {sum(len(d.attractions) for d in result.days)}")
        print(f"   标签: {result.overall_tags}")

        return GuideExtractionResponse(
            success=True,
            message=f"成功提取{result.source_count}篇攻略，识别{result.total_days}天行程",
            data=result,
        )

    except ValueError as e:
        print(f"⚠️ 攻略解析失败: {str(e)}")
        return GuideExtractionResponse(
            success=False,
            message=f"攻略解析失败: {str(e)}",
        )
    except Exception as e:
        print(f"❌ 攻略提取异常: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"攻略提取失败: {str(e)}"
        )


@router.post(
    "/plan-from-skeleton",
    response_model=TripPlanResponse,
    summary="基于确认骨架生成完整行程",
    description="用户确认攻略骨架后，基于骨架补全细节、适配偏好、生成完整行程计划。"
)
async def plan_from_skeleton(request: GuideConfirmRequest):
    """
    骨架确认 → 完整行程（两段式流程的第二步：补全+生成）

    Args:
        request: 包含用户确认后的骨架 + 原始行程参数

    Returns:
        完整的旅行计划
    """
    try:
        print(f"\n{'='*60}")
        print(f"📥 收到骨架驱动规划请求:")
        print(f"   出发地: {request.trip_params.departure_city}")
        print(f"   目的地: {request.trip_params.cities}")
        print(f"   天数: {request.trip_params.travel_days}")
        selected_count = sum(
            sum(1 for a in d.attractions if a.selected)
            for d in request.skeleton.days
        )
        print(f"   骨架景点(已选): {selected_count}个")
        print(f"{'='*60}\n")

        trip_plan = await asyncio.to_thread(
            plan_trip_from_skeleton, request.trip_params, request.skeleton
        )

        print("✅ 骨架驱动行程生成成功\n")

        return TripPlanResponse(
            success=True,
            message="基于攻略骨架的旅行计划生成成功",
            data=trip_plan,
        )

    except Exception as e:
        print(f"❌ 骨架驱动规划失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"行程生成失败: {str(e)}"
        )


@router.get(
    "/health",
    summary="健康检查",
    description="检查旅行规划服务是否正常"
)
async def health_check():
    """健康检查"""
    try:
        # 检查Agent是否可用
        agent = get_trip_planner_agent()
        
        return {
            "status": "healthy",
            "service": "trip-planner",
            "agent_name": agent.agent.name,
            "tools_count": len(agent.agent.list_tools())
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"服务不可用: {str(e)}"
        )